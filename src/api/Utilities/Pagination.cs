namespace BikerHub.Utilities;

public static class Pagination
{
    public static int GetTotalPages(int totalItems, int pageSize)
    {
        if (pageSize <= 0) return 0;
        return (int)Math.Ceiling(totalItems / (double)pageSize);
    }
}