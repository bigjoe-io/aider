import { loadContext } from "../chain.js";
import { emit } from "../output.js";
import { loadRequestView, parseRequestId } from "../requests.js";
export async function cmdStatus(requestIdRaw) {
    const id = parseRequestId(requestIdRaw);
    const ctx = await loadContext();
    const view = await loadRequestView(ctx, id);
    emit(view.json, view.human);
}
//# sourceMappingURL=status.js.map