// app/api/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get("q") || "";
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") || "20");
    const set = url.searchParams.get("set") || "";
    const type = url.searchParams.get("type") || "";
    const rarity = url.searchParams.get("rarity") || "";

    // Skip value for pagination
    const skip = (page - 1) * pageSize;

    // Build search filters
    const filters: Prisma.CardWhereInput = {};

    // Search by name using fuzzy search (always on)
    if (query) {
      // Case-insensitive fuzzy search (contains)
      filters.name = {
        contains: query,
        mode: "insensitive",
      };
    }

    // Filter by set if provided
    if (set && set !== 'all') {
      filters.setId = set;
    }

    // Filter by type if provided
    if (type && type !== 'all') {
      filters.types = {
        has: type,
      };
    }

    // Filter by rarity if provided
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