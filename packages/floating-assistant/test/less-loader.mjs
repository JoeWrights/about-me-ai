export async function load(url, context, defaultLoad) {
  if (url.endsWith(".css") || url.endsWith(".less")) {
    return {
      format: "module",
      shortCircuit: true,
      source: "export default {};",
    };
  }

  return defaultLoad(url, context, defaultLoad);
}
