import { getBaseUrl, PRODUCTION_API_URL } from "../api";

describe("getBaseUrl", () => {
  it("usa EXPO_PUBLIC_API_URL quando definida", () => {
    expect(getBaseUrl({ envUrl: "https://api.exemplo.com/api", isDev: false })).toBe("https://api.exemplo.com/api");
  });

  it("em build de release sem variável, usa a API de produção em HTTPS", () => {
    const url = getBaseUrl({ envUrl: "", isDev: false, hostUri: "192.168.0.10:8081", platform: "android" });
    expect(url).toBe(PRODUCTION_API_URL);
    expect(url.startsWith("https://")).toBe(true);
  });

  it("em desenvolvimento usa o IP do Metro bundler", () => {
    expect(getBaseUrl({ envUrl: "", isDev: true, hostUri: "192.168.0.10:8081" })).toBe("http://192.168.0.10:3001/api");
  });

  it("em desenvolvimento ignora o host do modo tunnel", () => {
    expect(getBaseUrl({ envUrl: "", isDev: true, hostUri: "abc.exp.direct:80", platform: "ios" })).toBe(
      "http://localhost:3001/api"
    );
  });

  it("em desenvolvimento no emulador Android usa 10.0.2.2", () => {
    expect(getBaseUrl({ envUrl: "", isDev: true, hostUri: undefined, platform: "android" })).toBe(
      "http://10.0.2.2:3001/api"
    );
  });
});
