import * as bobotService from '../../services/bobotService.js';
export async function list(req,res){ const result = await bobotService.listBobot(req.query); res.json(result); }
export async function update(req,res){ const result = await bobotService.updateBobot(req.body, { userId: req.user.userId, ip: req.ip }); res.json({ data: result }); }
export default { list, update };
