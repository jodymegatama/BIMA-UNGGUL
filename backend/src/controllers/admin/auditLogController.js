import { prisma } from '../../db/prisma.js';
export async function list(req,res){
  let { userId, action, entity, from, to, page='1', limit='20' } = req.query;
  let p=parseInt(page,10); let l=parseInt(limit,10);
  if(!Number.isFinite(p)||p<1) p=1; if(!Number.isFinite(l)||l<1) l=20; if(l>100) l=100;
  const where={};
  if(userId) where.userId=parseInt(userId,10);
  if(action) where.action=String(action);
  if(entity) where.entity=String(entity);
  if(from||to) { where.createdAt={}; if(from) where.createdAt.gte=new Date(from); if(to) where.createdAt.lte=new Date(to); }
  const [data,total]=await Promise.all([
    prisma.auditLog.findMany({ where, include:{user:{select:{id:true,nip:true,name:true}}}, orderBy:{createdAt:'desc'}, skip:(p-1)*l, take:l}),
    prisma.auditLog.count({where}),
  ]);
  res.json({ data, total, page:p, limit:l });
}
export default { list };
