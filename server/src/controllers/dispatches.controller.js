import { AppError } from "../lib/http.js";
import * as dispatches from "../models/dispatches.model.js";
export const getDispatches = async (_req, res) => res.json(await dispatches.listDispatches());
export async function getDispatch(req, res) { const dispatch = await dispatches.findDispatch(req.params.id); if (!dispatch) throw new AppError(404, "Dispatch not found"); res.json(dispatch); }
