import { loadContext } from "../chain.js";
import { emit } from "../output.js";
import { loadRequestView, parseRequestId } from "../requests.js";

export async function cmdStatus(requestIdRaw: string): Promise<void> {
  const id = parseRequestId(requestIdRaw);
  const ctx = loadContext();
  const view = await loadRequestView(ctx, id);
  emit(view.json, view.human);
}
