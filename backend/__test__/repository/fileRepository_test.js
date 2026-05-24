import prisma from "#app/database.js";
import FileRepository from "#repository/fileRepository.js";

jest.mock("#app/database.js", () => ({
  file: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
}));

/**
 * Unit test untuk FileRepository
 * @describe FileRepository
 */
describe("FileRepository", () => {
  let repo;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new FileRepository();
  });

  /**
   * @describe create
   */
  describe("create", () => {
    /**
     * @test Membuat file baru dengan semua field
     */
    it("should create a file with all fields", async () => {
      const input = {
        path: "uploads/receipt-001.jpg",
        fileName: "receipt-001.jpg",
        mimeType: "image/jpeg",
        size: 204800,
        checksum: "abc123def456",
        uploadedById: "user-1",
      };

      const expected = {
        id: "file-1",
        path: "uploads/receipt-001.jpg",
        fileName: "receipt-001.jpg",
        mimeType: "image/jpeg",
        size: 204800,
        checksum: "abc123def456",
        uploadedById: "user-1",
        createdAt: new Date(),
      };

      prisma.file.create.mockResolvedValue(expected);

      const result = await repo.create(input);

      expect(result).toEqual(expected);
      expect(prisma.file.create).toHaveBeenCalledWith({
        data: {
          path: "uploads/receipt-001.jpg",
          fileName: "receipt-001.jpg",
          mimeType: "image/jpeg",
          size: 204800,
          checksum: "abc123def456",
          uploadedById: "user-1",
        },
        select: {
          id: true,
          path: true,
          fileName: true,
          mimeType: true,
          size: true,
          checksum: true,
          uploadedById: true,
          createdAt: true,
        },
      });
    });

    /**
     * @test Membuat file dengan field minimal
     */
    it("should create a file with minimal fields", async () => {
      const input = {
        path: "uploads/doc-001.pdf",
        fileName: "doc-001.pdf",
      };

      const expected = {
        id: "file-2",
        path: "uploads/doc-001.pdf",
        fileName: "doc-001.pdf",
        mimeType: null,
        size: null,
        checksum: null,
        uploadedById: null,
        createdAt: new Date(),
      };

      prisma.file.create.mockResolvedValue(expected);

      const result = await repo.create(input);

      expect(result).toEqual(expected);
      expect(prisma.file.create).toHaveBeenCalledWith({
        data: {
          path: "uploads/doc-001.pdf",
          fileName: "doc-001.pdf",
          mimeType: undefined,
          size: undefined,
          checksum: undefined,
          uploadedById: undefined,
        },
        select: expect.any(Object),
      });
    });
  });

  /**
   * @describe findById
   */
  describe("findById", () => {
    /**
     * @test Mengembalikan file lengkap dengan uploader ketika ditemukan
     */
    it("should return file with uploader when found", async () => {
      const mockFile = {
        id: "file-1",
        path: "uploads/receipt-001.jpg",
        fileName: "receipt-001.jpg",
        mimeType: "image/jpeg",
        size: 204800,
        checksum: "abc123def456",
        uploadedById: "user-1",
        createdAt: new Date(),
        uploadedBy: {
          id: "user-1",
          fullName: "Kasir 1",
        },
      };

      prisma.file.findUnique.mockResolvedValue(mockFile);

      const result = await repo.findById("file-1");

      expect(result).toEqual(mockFile);
      expect(prisma.file.findUnique).toHaveBeenCalledWith({
        where: { id: "file-1" },
        include: {
          uploadedBy: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      });
    });

    /**
     * @test Mengembalikan null ketika file tidak ditemukan
     */
    it("should return null when file not found", async () => {
      prisma.file.findUnique.mockResolvedValue(null);

      const result = await repo.findById("file-99");

      expect(result).toBeNull();
    });
  });

  /**
   * @describe findByChecksum
   */
  describe("findByChecksum", () => {
    /**
     * @test Mengembalikan file ketika checksum ditemukan
     */
    it("should return file when checksum found", async () => {
      const mockFile = {
        id: "file-1",
        path: "uploads/receipt-001.jpg",
        fileName: "receipt-001.jpg",
        checksum: "abc123def456",
        mimeType: "image/jpeg",
        size: 204800,
        createdAt: new Date(),
      };

      prisma.file.findFirst.mockResolvedValue(mockFile);

      const result = await repo.findByChecksum("abc123def456");

      expect(result).toEqual(mockFile);
      expect(prisma.file.findFirst).toHaveBeenCalledWith({
        where: { checksum: "abc123def456" },
      });
    });

    /**
     * @test Mengembalikan null ketika checksum tidak ditemukan
     */
    it("should return null when checksum not found", async () => {
      prisma.file.findFirst.mockResolvedValue(null);

      const result = await repo.findByChecksum("nonexistent");

      expect(result).toBeNull();
    });
  });

  /**
   * @describe findByPath
   */
  describe("findByPath", () => {
    /**
     * @test Mengembalikan file ketika path ditemukan
     */
    it("should return file when path found", async () => {
      const mockFile = {
        id: "file-1",
        path: "uploads/receipt-001.jpg",
        fileName: "receipt-001.jpg",
        checksum: "abc123",
        mimeType: "image/jpeg",
        size: 204800,
        createdAt: new Date(),
      };

      prisma.file.findFirst.mockResolvedValue(mockFile);

      const result = await repo.findByPath("uploads/receipt-001.jpg");

      expect(result).toEqual(mockFile);
      expect(prisma.file.findFirst).toHaveBeenCalledWith({
        where: { path: "uploads/receipt-001.jpg" },
      });
    });

    /**
     * @test Mengembalikan null ketika path tidak ditemukan
     */
    it("should return null when path not found", async () => {
      prisma.file.findFirst.mockResolvedValue(null);

      const result = await repo.findByPath("uploads/nonexistent.jpg");

      expect(result).toBeNull();
    });
  });

  /**
   * @describe findMany
   */
  describe("findMany", () => {
    /**
     * @test Mengembalikan file dengan paginasi default
     */
    it("should return files with default pagination", async () => {
      const mockData = [
        {
          id: "file-1",
          path: "uploads/receipt-001.jpg",
          fileName: "receipt-001.jpg",
          mimeType: "image/jpeg",
          size: 204800,
          checksum: "abc123",
          uploadedById: "user-1",
          createdAt: new Date(),
          uploadedBy: { id: "user-1", fullName: "Kasir 1" },
        },
        {
          id: "file-2",
          path: "uploads/receipt-002.jpg",
          fileName: "receipt-002.jpg",
          mimeType: "image/jpeg",
          size: 150000,
          checksum: "def456",
          uploadedById: "user-2",
          createdAt: new Date(),
          uploadedBy: { id: "user-2", fullName: "Kasir 2" },
        },
      ];

      prisma.file.count.mockResolvedValue(2);
      prisma.file.findMany.mockResolvedValue(mockData);

      const result = await repo.findMany({});

      expect(result.data).toEqual(mockData);
      expect(result.data).toHaveLength(2);
      expect(result.metadata.total).toBe(2);
      expect(result.metadata.currentPage).toBe(1);
      expect(prisma.file.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        include: {
          uploadedBy: {
            select: { id: true, fullName: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    });

    /**
     * @test Mengembalikan file dengan filter uploadedById
     */
    it("should return files filtered by uploadedById", async () => {
      const query = { uploadedById: "user-1", page: 1, limit: 5 };

      prisma.file.count.mockResolvedValue(3);
      prisma.file.findMany.mockResolvedValue([]);

      await repo.findMany(query);

      expect(prisma.file.findMany).toHaveBeenCalledWith({
        where: { uploadedById: "user-1" },
        skip: 0,
        take: 5,
        include: expect.any(Object),
        orderBy: { createdAt: "desc" },
      });
    });

    /**
     * @test Mengembalikan file dengan filter rentang tanggal
     */
    it("should return files filtered by date range", async () => {
      const query = {
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-06-30"),
      };

      prisma.file.count.mockResolvedValue(10);
      prisma.file.findMany.mockResolvedValue([]);

      await repo.findMany(query);

      expect(prisma.file.findMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            gte: new Date("2025-01-01"),
            lte: new Date("2025-06-30"),
          },
        },
        skip: 0,
        take: 10,
        include: expect.any(Object),
        orderBy: { createdAt: "desc" },
      });
    });

    /**
     * @test Mengembalikan file hanya dengan startDate
     */
    it("should return files filtered by startDate only", async () => {
      const query = { startDate: new Date("2025-01-01") };

      prisma.file.count.mockResolvedValue(5);
      prisma.file.findMany.mockResolvedValue([]);

      await repo.findMany(query);

      expect(prisma.file.findMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            gte: new Date("2025-01-01"),
          },
        },
        skip: 0,
        take: 10,
        include: expect.any(Object),
        orderBy: { createdAt: "desc" },
      });
    });

    /**
     * @test Mengembalikan array kosong ketika tidak ada file
     */
    it("should return empty array when no files", async () => {
      prisma.file.count.mockResolvedValue(0);
      prisma.file.findMany.mockResolvedValue([]);

      const result = await repo.findMany({});

      expect(result.data).toEqual([]);
      expect(result.metadata.total).toBe(0);
    });
  });

  /**
   * @describe delete
   */
  describe("delete", () => {
    /**
     * @test Menghapus file berdasarkan ID
     */
    it("should delete a file by ID", async () => {
      prisma.file.delete.mockResolvedValue({});

      await repo.delete("file-1");

      expect(prisma.file.delete).toHaveBeenCalledWith({
        where: { id: "file-1" },
      });
    });
  });

  /**
   * @describe deleteByPath
   */
  describe("deleteByPath", () => {
    /**
     * @test Menghapus file berdasarkan path ketika file ditemukan
     */
    it("should delete a file by path when file exists", async () => {
      prisma.file.findFirst.mockResolvedValue({ id: "file-1" });
      prisma.file.delete.mockResolvedValue({});

      await repo.deleteByPath("uploads/receipt-001.jpg");

      expect(prisma.file.findFirst).toHaveBeenCalledWith({
        where: { path: "uploads/receipt-001.jpg" },
        select: { id: true },
      });
      expect(prisma.file.delete).toHaveBeenCalledWith({
        where: { id: "file-1" },
      });
    });

    /**
     * @test Tidak melakukan apa-apa ketika file tidak ditemukan
     */
    it("should do nothing when file not found by path", async () => {
      prisma.file.findFirst.mockResolvedValue(null);

      await repo.deleteByPath("uploads/nonexistent.jpg");

      expect(prisma.file.findFirst).toHaveBeenCalledWith({
        where: { path: "uploads/nonexistent.jpg" },
        select: { id: true },
      });
      expect(prisma.file.delete).not.toHaveBeenCalled();
    });
  });
});