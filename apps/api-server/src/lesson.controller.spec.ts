import { Test, TestingModule } from "@nestjs/testing";
import { LessonController } from "./lesson.controller";
import { LessonService } from "./lesson.service";
import { describe, it, expect, beforeEach, vi } from "vitest";

describe("LessonController", () => {
  let controller: LessonController;
  let service: any;

  beforeEach(async () => {
    service = {
      create: vi.fn().mockResolvedValue({ id: "1", title: "Test Lesson" }),
      findAll: vi.fn().mockResolvedValue([{ id: "1", title: "Test Lesson" }]),
      findOne: vi.fn().mockResolvedValue({ id: "1", title: "Test Lesson" }),
      update: vi.fn().mockResolvedValue({ id: "1", title: "Updated Lesson" }),
      remove: vi.fn().mockResolvedValue({ id: "1" }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LessonController],
      providers: [{ provide: LessonService, useValue: service }],
    }).compile();

    controller = module.get<LessonController>(LessonController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("create() should call service.create", async () => {
    const dto = { title: "Test", courseId: "course-1" };
    await controller.create(dto as any);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it("findAll() should call service.findAll", async () => {
    await controller.findAll("course-1");
    expect(service.findAll).toHaveBeenCalledWith("course-1");
  });
});
