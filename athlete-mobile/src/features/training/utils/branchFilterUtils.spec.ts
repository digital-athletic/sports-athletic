import { Branch } from "@/features/training/models/BranchFilter";
import { TemporalDataType } from "../models/TemporalData";
import {
  filterByAge,
  filterByGender,
  filterByPrevention,
  filterByRegion,
  filterBySoreness,
} from "./branchFilterUtils";

describe("branchFilterUtils", () => {
  const createBranch = (tags: string[]): Branch => ({
    tags,
    exercises: { "1": { exerciseId: "1" } },
  });

  describe("filterByAge", () => {
    it("keeps branches without age tags", () => {
      const branches = {
        "1": createBranch(["REGION_CORE"]),
      };
      const result = filterByAge(branches, "CHILD");
      expect(result.keep).toEqual(branches);
    });

    it("filters branches by CHILD age group", () => {
      const branches = {
        "1": createBranch(["AGE_CHILD"]),
        "2": createBranch(["AGE_ADULT"]),
        "3": createBranch(["REGION_CORE"]),
      };
      const result = filterByAge(branches, "CHILD");
      expect(Object.keys(result.keep)).toHaveLength(2);
      expect(result.keep["1"]).toBeDefined();
      expect(result.keep["3"]).toBeDefined();
      expect(result.keep["2"]).toBeUndefined();
    });

    it("filters branches by ADULT age group", () => {
      const branches = {
        "1": createBranch(["AGE_CHILD"]),
        "2": createBranch(["AGE_ADULT"]),
      };
      const result = filterByAge(branches, "ADULT");
      expect(Object.keys(result.keep)).toHaveLength(1);
      expect(result.keep["2"]).toBeDefined();
    });
  });

  describe("filterByGender", () => {
    it("keeps branches without gender tags", () => {
      const branches = {
        "1": createBranch(["REGION_CORE"]),
      };
      const result = filterByGender(branches, "MALE");
      expect(result.keep).toEqual(branches);
    });

    it("filters branches by MALE gender", () => {
      const branches = {
        "1": createBranch(["GENDER_MALE"]),
        "2": createBranch(["GENDER_FEMALE"]),
        "3": createBranch(["REGION_CORE"]),
      };
      const result = filterByGender(branches, "MALE");
      expect(Object.keys(result.keep)).toHaveLength(2);
      expect(result.keep["1"]).toBeDefined();
      expect(result.keep["3"]).toBeDefined();
    });

    it("filters branches by FEMALE gender", () => {
      const branches = {
        "1": createBranch(["GENDER_MALE"]),
        "2": createBranch(["GENDER_FEMALE"]),
      };
      const result = filterByGender(branches, "FEMALE");
      expect(Object.keys(result.keep)).toHaveLength(1);
      expect(result.keep["2"]).toBeDefined();
    });
  });

  describe("filterByRegion", () => {
    it("keeps all branches when no regions specified", () => {
      const branches = {
        "1": createBranch(["REGION_CORE"]),
        "2": createBranch(["REGION_UPPER_BODY"]),
      };
      const result = filterByRegion(branches, []);
      expect(result.keep).toEqual(branches);
    });

    it("keeps branches without region tags", () => {
      const branches = {
        "1": createBranch(["AGE_ADULT"]),
      };
      const result = filterByRegion(branches, ["CORE"]);
      expect(result.keep).toEqual(branches);
    });

    it("filters branches by specific regions", () => {
      const branches = {
        "1": createBranch(["REGION_CORE"]),
        "2": createBranch(["REGION_UPPER_BODY"]),
        "3": createBranch(["REGION_LOWER_BODY"]),
      };
      const result = filterByRegion(branches, ["CORE", "UPPER_BODY"]);
      expect(Object.keys(result.keep)).toHaveLength(2);
      expect(result.keep["1"]).toBeDefined();
      expect(result.keep["2"]).toBeDefined();
    });
  });

  describe("filterByPrevention", () => {
    it("returns all branches when prevRegions is null", () => {
      const branches = {
        "1": createBranch(["PREVENTION_SHOULDER"]),
      };
      const result = filterByPrevention(branches, null);
      expect(result.keep).toEqual(branches);
    });

    it("returns all branches when prevRegions is empty", () => {
      const branches = {
        "1": createBranch(["PREVENTION_SHOULDER"]),
      };
      const result = filterByPrevention(branches, []);
      expect(result.keep).toEqual(branches);
    });

    it("filters branches by prevention regions", () => {
      const branches = {
        "1": createBranch(["PREVENTION_SHOULDER"]),
        "2": createBranch(["PREVENTION_KNEE"]),
        "3": createBranch(["PREVENTION_ANKLE"]),
      };
      const result = filterByPrevention(branches, ["SHOULDER", "KNEE"]);
      expect(Object.keys(result.keep)).toHaveLength(2);
      expect(result.keep["1"]).toBeDefined();
      expect(result.keep["2"]).toBeDefined();
    });
  });

  describe("filterBySoreness", () => {
    it("returns all branches when temporalData is null", () => {
      const branches = {
        "1": createBranch(["REGION_CORE"]),
      };
      const result = filterBySoreness(branches, null, "SWR1");
      expect(result.keep).toEqual(branches);
    });

    it("returns all branches for ignored soreness skills", () => {
      const branches = {
        "1": createBranch(["REGION_UPPER_BODY"]),
      };
      const temporalData: TemporalDataType[] = [
        {
          tag: "CHEST",
          date: "2024-01-01T00:00:00.000Z",
          expiration: "2024-01-03T00:00:00.000Z",
        },
      ];
      const result = filterBySoreness(branches, temporalData, "MOB", false, [
        "MOB",
      ]);
      expect(result.keep).toEqual(branches);
    });

    it("filters out branches in sore areas", () => {
      const branches = {
        "1": createBranch(["REGION_UPPER_BODY"]),
        "2": createBranch(["REGION_LOWER_BODY"]),
        "3": createBranch(["REGION_CORE"]),
      };
      const temporalData: TemporalDataType[] = [
        {
          tag: "CHEST",
          date: "2024-01-01T00:00:00.000Z",
          expiration: "2024-01-03T00:00:00.000Z",
        },
      ];
      const result = filterBySoreness(branches, temporalData, "SWR1");
      expect(Object.keys(result.keep)).toHaveLength(2);
      expect(result.keep["2"]).toBeDefined();
      expect(result.keep["3"]).toBeDefined();
      expect(result.replace).toContain("UPPER_BODY");
    });

    it("throws error for multiple sore regions", () => {
      const branches = {
        "1": createBranch(["REGION_CORE"]),
      };
      const temporalData: TemporalDataType[] = [
        {
          tag: "CHEST",
          date: "2024-01-01T00:00:00.000Z",
          expiration: "2024-01-03T00:00:00.000Z",
        },
        {
          tag: "GLUTES",
          date: "2024-01-01T00:00:00.000Z",
          expiration: "2024-01-03T00:00:00.000Z",
        },
      ];
      expect(() => filterBySoreness(branches, temporalData, "SWR1")).toThrow();
    });

    it("throws error for PREV short workout with soreness in area", () => {
      const branches = {
        "1": createBranch(["REGION_UPPER_BODY"]),
      };
      const temporalData: TemporalDataType[] = [
        {
          tag: "SHOULDER",
          date: "2024-01-01T00:00:00.000Z",
          expiration: "2024-01-03T00:00:00.000Z",
        },
      ];
      expect(() =>
        filterBySoreness(branches, temporalData, "PREVSHOULDER", true),
      ).toThrow();
    });

    it("returns empty keep for CARDIO with lower_body soreness", () => {
      const branches = {
        "1": createBranch(["REGION_LOWER_BODY"]),
      };
      const temporalData: TemporalDataType[] = [
        {
          tag: "GLUTES",
          date: "2024-01-01T00:00:00.000Z",
          expiration: "2024-01-03T00:00:00.000Z",
        },
      ];
      const result = filterBySoreness(branches, temporalData, "CARDIO_1");
      expect(Object.keys(result.keep)).toHaveLength(0);
      expect(result.replace).toContain("LOWER_BODY");
    });
  });
});
