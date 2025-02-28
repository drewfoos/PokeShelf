// app/api/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    let query = url.searchParams.get("q") || "";
    let page = parseInt(url.searchParams.get("page") || "1", 10);
    let pageSize = parseInt(url.searchParams.get("pageSize") || "20", 10);
    let set = url.searchParams.get("set") || "";
    let type = url.searchParams.get("type") || "";
    let rarity = url.searchParams.get("rarity") || "";

    // --- Input Validation & Sanitization ---
    // Limit maximum query length to 100 characters
    const MAX_QUERY_LENGTH = 100;
    if (query.length > MAX_QUERY_LENGTH) {
      query = query.substring(0, MAX_QUERY_LENGTH);
    }

    // Remove control characters from the query (basic sanitization)
    query = query.replace(/[\u0000-\u001F\u007F]/g, "");

    // Validate page and pageSize values
    if (isNaN(page) || page < 1) {
      page = 1;
    }
    // Limit pageSize to a maximum value (e.g., 100) to prevent abuse
    if (isNaN(pageSize) || pageSize < 1 || pageSize > 100) {
      pageSize = 20;
    }

    // Skip value for pagination
    const skip = (page - 1) * pageSize;

    // Build search filters using Prisma's typed filter
    const filters: Prisma.CardWhereInput = {};

    // Fuzzy search by name (case-insensitive)
    if (query) {
      filters.name = {
        contains: query,
        mode: "insensitive",
      };
    }

    // Filter by set if provided and not 'all'
    if (set && set !== 'all') {
      filters.setId = set;
    }

    // Filter by type if provided and not 'all'
    if (type && type !== 'all') {
      filters.types = {
        has: type,
      };
    }

    // Filter by rarity if provided and not 'all'
    if (rarity && rarity !== 'all') {
      filters.rarity = rarity;
    }

    // Execute search with pagination
    const [cards, totalCount] = await Promise.all([
      prisma.card.findMany({
        where: filters,
        skip,
        take: pageSize,
        orderBy: {
          name: "asc",
        },
      }),
      prisma.card.count({
        where: filters,
      }),
    ]);

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / pageSize);

    return NextResponse.json({
      cards,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error searching cards:", error);
    return NextResponse.json(
      { error: "Failed to search cards" },
      { status: 500 }
    );
  }
}
