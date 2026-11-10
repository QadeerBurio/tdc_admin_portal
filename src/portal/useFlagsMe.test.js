import { fetchFlags, __resetFlagsCache, REFRESH_GAP_MS } from "./useFlagsMe";
import api from "../services/api";

jest.mock("../services/api", () => ({ __esModule: true, default: { get: jest.fn() } }));

let now = 1_000_000;
beforeEach(() => {
  __resetFlagsCache();
  api.get.mockReset();
  now = 1_000_000;
  jest.spyOn(Date, "now").mockImplementation(() => now);
  localStorage.setItem("token", "token-brand-a");
});
afterEach(() => jest.restoreAllMocks());

test("fetches once, then reuses the answer for a minute", async () => {
  api.get.mockResolvedValue({ data: { loyaltyV2: false } });
  expect(await fetchFlags()).toEqual({ loyaltyV2: false });
  now += REFRESH_GAP_MS - 1;
  await fetchFlags();
  expect(api.get).toHaveBeenCalledTimes(1);
  api.get.mockResolvedValue({ data: { loyaltyV2: true } });
  now += 2;
  expect(await fetchFlags()).toEqual({ loyaltyV2: true });
  expect(api.get).toHaveBeenCalledTimes(2);
});

test("simultaneous callers share one request", async () => {
  api.get.mockResolvedValue({ data: { surplusBoxes: true } });
  const all = await Promise.all([fetchFlags(), fetchFlags(), fetchFlags()]);
  expect(api.get).toHaveBeenCalledTimes(1);
  expect(all.every((f) => f.surplusBoxes)).toBe(true);
});

test("another account in the same tab never gets the previous one's flags", async () => {
  api.get.mockResolvedValue({ data: { loyaltyV2: true } });
  await fetchFlags();
  localStorage.setItem("token", "token-brand-b");
  api.get.mockResolvedValue({ data: { loyaltyV2: false } });
  expect(await fetchFlags()).toEqual({ loyaltyV2: false });
  expect(api.get).toHaveBeenCalledTimes(2);
});

test("a failed refresh keeps the last answer", async () => {
  api.get.mockResolvedValue({ data: { careerTimeline: true } });
  await fetchFlags();
  now += REFRESH_GAP_MS + 1;
  api.get.mockRejectedValue(new Error("offline"));
  expect(await fetchFlags()).toEqual({ careerTimeline: true });
});

test("force skips the one-minute gap", async () => {
  api.get.mockResolvedValue({ data: {} });
  await fetchFlags();
  await fetchFlags({ force: true });
  expect(api.get).toHaveBeenCalledTimes(2);
});
