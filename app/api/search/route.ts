// app/api/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { SearchCardsRequest, SearchCardsResponse, Pagination } from "@/types";
import { Card, mapMongoCardToInterface } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    
    // Extract search parameters with proper typing
    const params: SearchCardsRequest = {
      q: url.searchParams.get("q") || "",
      page: parseInt(url.searchParams.get("page") || "1", 10),
      pageSize: parseInt(url.searchParams.get("pageSize") || "20", 10),
      set: url.searchParams.get("set") || "",
      type: url.searchParams.get("type") || "",
      rarity: url.searchParams.get("rarity") || ""
    };

    // --- Input Validation & Sanitization ---
    // Limit maximum query length to 100 characters
    const MAX_QUERY_LENGTH = 100;
    if (params.q && params.q.length > MAX_QUERY_LENGTH) {
      params.q = params.q.substring(0, MAX_QUERY_LENGTH);
    }

    // Remove control characters from the query (basic sanitization)
    if (params.q) {
      params.q = params.q.replace(/[\u0000-\u001F\u007F]/g, "");
    }

    // Validate page and pageSize values
    if (isNaN(params.page as number) || (params.page as number) < 1) {
      params.page = 1;
    }
    
    // Limit pageSize to a maximum value (e.g., 100) to prevent abuse
    if (isNaN(params.pageSize as number) || (params.pageSize as number) < 1 || (params.pageSize as number) > 100) {
      params.pageSize = 20;
    }

    // Skip value for pagination
    const skip = ((params.page as number) - 1) * (params.pageSize as number);

    // Build search filters using Prisma's typed filter
    const filters: Prisma.CardWhereInput = {};

    // Fuzzy search by name (case-insensitive)
    if (params.q) {
      filters.name = {
        contains: params.q,
        mode: "insensitive",
      };
    }

    // Filter by set if provided and not 'all'
    if (params.set && params.set !== 'all') {
      filters.setId = params.set;
    }

    // Filter by type if provided and not 'all'
    if (params.type && params.type !== 'all') {
      filters.types = {
        has: params.type,
      };
    }

    // Filter by rarity if provided and not 'all'
    if (params.rarity && params.rarity !== 'all') {
      filters.rarity = params.rarity;
    }

    // Execute search with pagination
    const [cardDocs, totalCount] = await Promise.all([
      prisma.card.findMany({
        where: filters,
        skip,
        take: params.pageSize as number,
        orderBy: {
          name: "asc",
        },
      }),
      prisma.card.count({
        where: filters,
      }),
    ]);

    // Convert MongoDB documents to our typed Card interface
    const cards: Card[] = cardDocs.map(mapMongoCardToInterface);

    // Calculate total pages
    const pageSize = params.pageSize as number;
    const totalPages = Math.ceil(totalCount / pageSize);

    // Create properly typed pagination object
    const pagination: Pagination = {
      page: params.page as number,
      pageSize,
      totalCount,
      totalPages,
    };

    // Return properly typed response
    const response: SearchCardsResponse = {
      cards,
      pagination
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error searching cards:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to search cards",
        cards: [],
        pagination: {
          page: 1,
          pageSize: 20,
          totalCount: 0,
          totalPages: 0
        }
      } as SearchCardsResponse,
      { status: 500 }
    );
  }
}