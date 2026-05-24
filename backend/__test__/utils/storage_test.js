import Storage from "#shared/utils/storage.js";
import ApiError from "#shared/utils/error.js";
import supabase from "#lib/supabase.js";

jest.mock("#lib/supabase.js", () => {
  const mockBucket = {
    list: jest.fn(),
    upload: jest.fn(),
    createSignedUrl: jest.fn(),
    createSignedUrls: jest.fn(),
    remove: jest.fn(),
  };
  return {
    storage: {
      from: jest.fn().mockReturnValue(mockBucket),
    },
  };
});

describe("Storage", () => {
  let mockBucket;

  beforeAll(() => {
    process.env.APP_BUCKET = "test-bucket";
    process.env.PRIVATE_BUCKET = "private-bucket";
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockBucket = supabase.storage.from();
  });

  describe("uploadFile", () => {
    const mockFile = {
      buffer: Buffer.from("test"),
      checksum: "abc123hash",
      mimetype: "image/png",
      originalname: "test.png",
    };

    it("should throw error if file buffer is missing", async () => {
      await expect(Storage.uploadFile(null)).rejects.toThrow(ApiError);
      await expect(Storage.uploadFile({})).rejects.toThrow(ApiError);
    });

    it("should return existing file path if checksum already exists", async () => {
      mockBucket.list.mockResolvedValue({ data: [{ name: "abc123hash.png" }] });
      const result = await Storage.uploadFile(mockFile, "uploads");
      expect(result).toBe("uploads/abc123hash.png");
      expect(mockBucket.upload).not.toHaveBeenCalled();
    });

    it("should upload file successfully if it does not exist", async () => {
      mockBucket.list.mockResolvedValue({ data: [] });
      mockBucket.upload.mockResolvedValue({ data: {}, error: null });

      const result = await Storage.uploadFile(mockFile, "images");
      expect(result).toBe("images/abc123hash.png");
    });

    it("should handle files without extension", async () => {
      const noExtFile = { ...mockFile, originalname: "testfile" };
      mockBucket.list.mockResolvedValue({ data: null });
      mockBucket.upload.mockResolvedValue({ error: null });

      const result = await Storage.uploadFile(noExtFile);
      expect(result).toBe("uploads/abc123hash.testfile");
    });

    it("should throw 500 if upload fails", async () => {
      mockBucket.list.mockResolvedValue({ data: [] });
      mockBucket.upload.mockResolvedValue({ error: new Error("Upload Failed") });

      await expect(Storage.uploadFile(mockFile)).rejects.toMatchObject({
        statusCode: 500,
      });
    });

    it("should use default directory uploads", async () => {
      mockBucket.list.mockResolvedValue({ data: [] });
      mockBucket.upload.mockResolvedValue({ data: {}, error: null });

      await Storage.uploadFile(mockFile);
      expect(mockBucket.upload).toHaveBeenCalledWith(
        expect.stringContaining("uploads/"),
        expect.any(Buffer),
        expect.any(Object)
      );
    });
  });

  describe("getSignedUrl", () => {
    it("should throw error if path is empty", async () => {
      await expect(Storage.getSignedUrl("")).rejects.toThrow(ApiError);
      await expect(Storage.getSignedUrl(null)).rejects.toThrow(ApiError);
    });

    it("should return signed URL successfully", async () => {
      mockBucket.createSignedUrl.mockResolvedValue({
        data: { signedUrl: "https://example.com/signed.jpg" },
        error: null,
      });

      const result = await Storage.getSignedUrl("uploads/test.jpg");
      expect(result).toBe("https://example.com/signed.jpg");
    });

    it("should use custom expiresIn", async () => {
      mockBucket.createSignedUrl.mockResolvedValue({
        data: { signedUrl: "https://example.com/signed.jpg" },
        error: null,
      });

      await Storage.getSignedUrl("path.jpg", 7200);
      expect(mockBucket.createSignedUrl).toHaveBeenCalledWith("path.jpg", 7200);
    });

    it("should throw 404 if file not found", async () => {
      mockBucket.createSignedUrl.mockResolvedValue({
        data: null,
        error: { message: "Object not found" },
      });

      await expect(Storage.getSignedUrl("path.jpg")).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("should throw 500 for generic errors", async () => {
      mockBucket.createSignedUrl.mockResolvedValue({
        data: null,
        error: { message: "Some internal error" },
      });

      await expect(Storage.getSignedUrl("path.jpg")).rejects.toMatchObject({
        statusCode: 500,
      });
    });
  });

  describe("getSignedUrls", () => {
    it("should throw error if paths are empty", async () => {
      await expect(Storage.getSignedUrls([])).rejects.toThrow(ApiError);
      await expect(Storage.getSignedUrls(null)).rejects.toThrow(ApiError);
    });

    it("should return multiple signed URLs", async () => {
      const mockData = [
        { path: "f1", signedUrl: "url1" },
        { path: "f2", signedUrl: "url2" },
      ];
      mockBucket.createSignedUrls.mockResolvedValue({ data: mockData, error: null });

      const result = await Storage.getSignedUrls(["f1", "f2"]);
      expect(result).toEqual(mockData);
    });
  });

  describe("deleteFile", () => {
    it("should throw error if path is empty", async () => {
      await expect(Storage.deleteFile("")).rejects.toThrow(ApiError);
      await expect(Storage.deleteFile(null)).rejects.toThrow(ApiError);
    });

    it("should delete file successfully", async () => {
      mockBucket.remove.mockResolvedValue({ error: null });
      const result = await Storage.deleteFile("file.jpg");
      expect(result).toBe(true);
    });

    it("should throw 500 if deletion fails", async () => {
      mockBucket.remove.mockResolvedValue({ error: new Error() });
      await expect(Storage.deleteFile("file.jpg")).rejects.toThrow(ApiError);
    });
  });

  describe("deleteMultipleFiles", () => {
    it("should throw error if paths array is empty", async () => {
      await expect(Storage.deleteMultipleFiles([])).rejects.toThrow(ApiError);
      await expect(Storage.deleteMultipleFiles(null)).rejects.toThrow(ApiError);
    });

    it("should delete multiple files from PRIVATE_BUCKET", async () => {
      mockBucket.remove.mockResolvedValue({ error: null });
      const result = await Storage.deleteMultipleFiles(["f1.jpg", "f2.jpg"]);

      expect(result).toBe(true);
      expect(supabase.storage.from).toHaveBeenCalledWith("private-bucket");
    });
  });
});