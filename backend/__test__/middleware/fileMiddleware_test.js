import {
    fileMiddleware,
    fileUploadSingle,
    fileUploadMultiple,
    fileUploadOptional,
  } from "#middleware/fileMiddleware.js";
  import multer from "multer";
  import sharp from "sharp";
  import crypto from "crypto";
  import ApiError from "#shared/utils/error.js";
  
  jest.mock("multer");
  jest.mock("sharp");
  jest.mock("#repository/fileRepository.js", () => {
    return jest.fn().mockImplementation(() => ({
      findByChecksum: jest.fn(),
    }));
  });
  
  /**
   * Unit test untuk File Middleware
   * @describe File Middleware
   */
  describe("File Middleware", () => {
    let req;
    let res;
    let next;
  
    beforeEach(() => {
      jest.clearAllMocks();
  
      req = {};
      res = {};
      next = jest.fn();
    });
  
    /**
     * @describe fileMiddleware (single)
     */
    describe("fileMiddleware (single)", () => {
      /**
       * @test Melempar error ketika file kosong
       */
      it("should throw bad request when file is empty", async () => {
        const multerHandler = jest.fn((req, res, cb) => {
          req.file = undefined;
          cb();
        });
  
        multer.mockReturnValue({ single: jest.fn().mockReturnValue(multerHandler) });
  
        const [upload, handler] = fileMiddleware({ field: "file", multiple: false });
  
        upload(req, res, () => {});
        await handler(req, res, next);
  
        expect(next).toHaveBeenCalledWith(
          expect.objectContaining({
            statusCode: 400,
            message: "File tidak boleh kosong",
          })
        );
      });
  
      /**
       * @test Memproses file gambar dan menambahkannya ke req.asset
       */
      it("should process image file and add to req.asset", async () => {
        const mockFile = {
          fieldname: "file",
          originalname: "test.jpg",
          encoding: "7bit",
          mimetype: "image/jpeg",
          buffer: Buffer.from("test"),
          size: 1024,
        };
  
        const multerHandler = jest.fn((req, res, cb) => {
          req.file = mockFile;
          cb();
        });
  
        multer.mockReturnValue({ single: jest.fn().mockReturnValue(multerHandler) });
  
        const processedBuffer = Buffer.from("processed-webp");
        sharp.mockReturnValue({
          resize: jest.fn().mockReturnThis(),
          webp: jest.fn().mockReturnThis(),
          toBuffer: jest.fn().mockResolvedValue(processedBuffer),
        });
  
        const { FileRepository } = require("#repository/fileRepository.js");
        FileRepository.mock.instances[0].findByChecksum.mockResolvedValue(null);
  
        const [upload, handler] = fileMiddleware({ field: "file", multiple: false });
  
        upload(req, res, () => {});
        await handler(req, res, next);
  
        expect(req.asset).toBeDefined();
        expect(req.asset.mimetype).toBe("image/webp");
        expect(req.asset.originalname).toBe("test.webp");
        expect(req.asset.checksum).toBeDefined();
        expect(next).toHaveBeenCalledWith();
      });
  
      /**
       * @test Melempar error ketika ukuran gambar melebihi batas
       */
      it("should throw bad request when image size exceeds limit", async () => {
        const largeBuffer = Buffer.alloc(11 * 1024 * 1024);
  
        const mockFile = {
          fieldname: "file",
          originalname: "large.jpg",
          encoding: "7bit",
          mimetype: "image/jpeg",
          buffer: largeBuffer,
          size: 11 * 1024 * 1024,
        };
  
        const multerHandler = jest.fn((req, res, cb) => {
          req.file = mockFile;
          cb();
        });
  
        multer.mockReturnValue({ single: jest.fn().mockReturnValue(multerHandler) });
  
        const [upload, handler] = fileMiddleware({ field: "file", multiple: false });
  
        upload(req, res, () => {});
        await handler(req, res, next);
  
        expect(next).toHaveBeenCalledWith(
          expect.objectContaining({ statusCode: 400 })
        );
      });
  
      /**
       * @test Melempar error ketika format file tidak didukung
       */
      it("should throw bad request for unsupported file format", async () => {
        const mockFile = {
          fieldname: "file",
          originalname: "test.exe",
          encoding: "7bit",
          mimetype: "application/x-msdownload",
          buffer: Buffer.from("test"),
          size: 1024,
        };
  
        const multerHandler = jest.fn((req, res, cb) => {
          req.file = mockFile;
          cb();
        });
  
        multer.mockReturnValue({ single: jest.fn().mockReturnValue(multerHandler) });
  
        const [upload, handler] = fileMiddleware({ field: "file", multiple: false });
  
        upload(req, res, () => {});
        await handler(req, res, next);
  
        expect(next).toHaveBeenCalledWith(
          expect.objectContaining({
            statusCode: 400,
            message: "Format file tidak didukung",
          })
        );
      });
  
      /**
       * @test Melempar error ketika file duplikat
       */
      it("should throw conflict when file is duplicate", async () => {
        const mockFile = {
          fieldname: "file",
          originalname: "test.jpg",
          encoding: "7bit",
          mimetype: "image/jpeg",
          buffer: Buffer.from("test"),
          size: 1024,
        };
  
        const multerHandler = jest.fn((req, res, cb) => {
          req.file = mockFile;
          cb();
        });
  
        multer.mockReturnValue({ single: jest.fn().mockReturnValue(multerHandler) });
  
        const processedBuffer = Buffer.from("processed");
        sharp.mockReturnValue({
          resize: jest.fn().mockReturnThis(),
          webp: jest.fn().mockReturnThis(),
          toBuffer: jest.fn().mockResolvedValue(processedBuffer),
        });
  
        const { FileRepository } = require("#repository/fileRepository.js");
        FileRepository.mock.instances[0].findByChecksum.mockResolvedValue({ id: "file-1" });
  
        const [upload, handler] = fileMiddleware({ field: "file", multiple: false });
  
        upload(req, res, () => {});
        await handler(req, res, next);
  
        expect(next).toHaveBeenCalledWith(
          expect.objectContaining({
            statusCode: 409,
            message: "File sudah pernah diunggah sebelumnya",
          })
        );
      });
  
      /**
       * @test Skip duplicate check ketika skipDuplicateCheck true
       */
      it("should skip duplicate check when skipDuplicateCheck is true", async () => {
        const mockFile = {
          fieldname: "file",
          originalname: "test.jpg",
          encoding: "7bit",
          mimetype: "image/jpeg",
          buffer: Buffer.from("test"),
          size: 1024,
        };
  
        const multerHandler = jest.fn((req, res, cb) => {
          req.file = mockFile;
          cb();
        });
  
        multer.mockReturnValue({ single: jest.fn().mockReturnValue(multerHandler) });
  
        const processedBuffer = Buffer.from("processed");
        sharp.mockReturnValue({
          resize: jest.fn().mockReturnThis(),
          webp: jest.fn().mockReturnThis(),
          toBuffer: jest.fn().mockResolvedValue(processedBuffer),
        });
  
        const [upload, handler] = fileMiddleware({
          field: "file",
          multiple: false,
          skipDuplicateCheck: true,
        });
  
        upload(req, res, () => {});
        await handler(req, res, next);
  
        expect(req.asset).toBeDefined();
        expect(next).toHaveBeenCalledWith();
      });
    });
  
    /**
     * @describe fileMiddleware (multiple)
     */
    describe("fileMiddleware (multiple)", () => {
      /**
       * @test Melempar error ketika files kosong
       */
      it("should throw bad request when files are empty", async () => {
        const multerHandler = jest.fn((req, res, cb) => {
          req.files = [];
          cb();
        });
  
        multer.mockReturnValue({ array: jest.fn().mockReturnValue(multerHandler) });
  
        const [upload, handler] = fileMiddleware({ field: "files", multiple: true });
  
        upload(req, res, () => {});
        await handler(req, res, next);
  
        expect(next).toHaveBeenCalledWith(
          expect.objectContaining({
            statusCode: 400,
            message: "File tidak boleh kosong",
          })
        );
      });
  
      /**
       * @test Memproses multiple files
       */
      it("should process multiple files and add to req.assets", async () => {
        const mockFiles = [
          {
            fieldname: "files",
            originalname: "test1.jpg",
            encoding: "7bit",
            mimetype: "image/jpeg",
            buffer: Buffer.from("test1"),
            size: 1024,
          },
          {
            fieldname: "files",
            originalname: "test2.jpg",
            encoding: "7bit",
            mimetype: "image/jpeg",
            buffer: Buffer.from("test2"),
            size: 2048,
          },
        ];
  
        const multerHandler = jest.fn((req, res, cb) => {
          req.files = mockFiles;
          cb();
        });
  
        multer.mockReturnValue({ array: jest.fn().mockReturnValue(multerHandler) });
  
        const processedBuffer = Buffer.from("processed");
        sharp.mockReturnValue({
          resize: jest.fn().mockReturnThis(),
          webp: jest.fn().mockReturnThis(),
          toBuffer: jest.fn().mockResolvedValue(processedBuffer),
        });
  
        const { FileRepository } = require("#repository/fileRepository.js");
        FileRepository.mock.instances[0].findByChecksum.mockResolvedValue(null);
  
        const [upload, handler] = fileMiddleware({ field: "files", multiple: true });
  
        upload(req, res, () => {});
        await handler(req, res, next);
  
        expect(req.assets).toHaveLength(2);
        expect(next).toHaveBeenCalledWith();
      });
  
      /**
       * @test Melempar error ketika ada file duplikat dalam satu request
       */
      it("should throw bad request for duplicate files in one request", async () => {
        const mockFiles = [
          {
            fieldname: "files",
            originalname: "test1.jpg",
            encoding: "7bit",
            mimetype: "image/jpeg",
            buffer: Buffer.from("same"),
            size: 1024,
          },
          {
            fieldname: "files",
            originalname: "test2.jpg",
            encoding: "7bit",
            mimetype: "image/jpeg",
            buffer: Buffer.from("same"),
            size: 1024,
          },
        ];
  
        const multerHandler = jest.fn((req, res, cb) => {
          req.files = mockFiles;
          cb();
        });
  
        multer.mockReturnValue({ array: jest.fn().mockReturnValue(multerHandler) });
  
        const processedBuffer = Buffer.from("processed");
        sharp.mockReturnValue({
          resize: jest.fn().mockReturnThis(),
          webp: jest.fn().mockReturnThis(),
          toBuffer: jest.fn().mockResolvedValue(processedBuffer),
        });
  
        const [upload, handler] = fileMiddleware({ field: "files", multiple: true });
  
        upload(req, res, () => {});
        await handler(req, res, next);
  
        expect(next).toHaveBeenCalledWith(
          expect.objectContaining({
            statusCode: 400,
            message: "Terdapat file duplikat dalam satu request",
          })
        );
      });
    });
  
    /**
     * @describe fileUploadSingle
     */
    describe("fileUploadSingle", () => {
      /**
       * @test Membuat middleware single dengan field default
       */
      it("should create single upload middleware with default field", () => {
        const middleware = fileUploadSingle();
        expect(middleware).toHaveLength(2);
      });
  
      /**
       * @test Membuat middleware single dengan custom field
       */
      it("should create single upload middleware with custom field", () => {
        const middleware = fileUploadSingle("image");
        expect(middleware).toHaveLength(2);
      });
    });
  
    /**
     * @describe fileUploadMultiple
     */
    describe("fileUploadMultiple", () => {
      /**
       * @test Membuat middleware multiple dengan field default
       */
      it("should create multiple upload middleware with default field", () => {
        const middleware = fileUploadMultiple();
        expect(middleware).toHaveLength(2);
      });
  
      /**
       * @test Membuat middleware multiple dengan custom field dan maxCount
       */
      it("should create multiple upload middleware with custom options", () => {
        const middleware = fileUploadMultiple("photos", 10);
        expect(middleware).toHaveLength(2);
      });
    });
  
    /**
     * @describe fileUploadOptional
     */
    describe("fileUploadOptional", () => {
      /**
       * @test Melewatkan file ketika tidak ada file yang diupload
       */
      it("should set req.asset to null when no file", async () => {
        const multerHandler = jest.fn((req, res, cb) => {
          req.file = undefined;
          cb();
        });
  
        multer.mockReturnValue({ single: jest.fn().mockReturnValue(multerHandler) });
  
        const [upload, handler] = fileUploadOptional("file");
  
        upload(req, res, () => {});
        await handler(req, res, next);
  
        expect(req.asset).toBeNull();
        expect(next).toHaveBeenCalledWith();
      });
  
      /**
       * @test Memproses file ketika ada file yang diupload
       */
      it("should process file when provided", async () => {
        const mockFile = {
          fieldname: "file",
          originalname: "test.jpg",
          encoding: "7bit",
          mimetype: "image/jpeg",
          buffer: Buffer.from("test"),
          size: 1024,
        };
  
        const multerHandler = jest.fn((req, res, cb) => {
          req.file = mockFile;
          cb();
        });
  
        multer.mockReturnValue({ single: jest.fn().mockReturnValue(multerHandler) });
  
        const processedBuffer = Buffer.from("processed");
        sharp.mockReturnValue({
          resize: jest.fn().mockReturnThis(),
          webp: jest.fn().mockReturnThis(),
          toBuffer: jest.fn().mockResolvedValue(processedBuffer),
        });
  
        const { FileRepository } = require("#repository/fileRepository.js");
        FileRepository.mock.instances[0].findByChecksum.mockResolvedValue(null);
  
        const [upload, handler] = fileUploadOptional("file");
  
        upload(req, res, () => {});
        await handler(req, res, next);
  
        expect(req.asset).toBeDefined();
        expect(next).toHaveBeenCalledWith();
      });
    });
  });