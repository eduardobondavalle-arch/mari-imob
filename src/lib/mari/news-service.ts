import "server-only";
import { z } from "zod";
import { db } from "./db";
import { assert } from "./http";

const schema = z.object({ title:z.string().trim().min(5).max(180), summary:z.string().trim().min(10).max(500), content:z.string().trim().max(30000).default(""), city:z.string().trim().min(2).max(100), coverImage:z.string().max(300).default(""), sourceUrl:z.union([z.literal(""),z.url()]).default(""), published:z.boolean(), featured:z.boolean(), publishedAt:z.string().datetime().optional() });
const slugify=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,120);
export async function saveNews(input:unknown,id?:string){const data=schema.parse(input);const slug=`${slugify(data.title)}-${id?.slice(-6)||Date.now().toString(36)}`;return id?db.news.update({where:{id},data:{...data,publishedAt:data.publishedAt?new Date(data.publishedAt):undefined}}):db.news.create({data:{...data,slug,publishedAt:data.publishedAt?new Date(data.publishedAt):new Date()}})}
export async function deleteNews(id:string){await db.news.delete({where:{id}});return{ok:true}}
export async function adminNews(){return db.news.findMany({orderBy:{publishedAt:"desc"}})}
export async function publicNews(take=6){return db.news.findMany({where:{published:true},orderBy:[{featured:"desc"},{publishedAt:"desc"}],take})}
export async function newsBySlug(slug:string){const row=await db.news.findFirst({where:{slug,published:true}});assert(row,404,"Notícia não encontrada.");return row}
