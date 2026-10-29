const allowedContentTypes=["application/json","application/json; charset=utf-8"];

export function rejectUnsafeRequest(request:Request,maxBytes=16384){
 const fetchSite=request.headers.get("sec-fetch-site");
 if(fetchSite==="cross-site")return Response.json({error:"forbidden"},{status:403});
 const contentType=request.headers.get("content-type")?.toLowerCase()??"";
 if(request.method!=="GET"&&!allowedContentTypes.includes(contentType))return Response.json({error:"invalid_content_type"},{status:415});
 const length=Number(request.headers.get("content-length")??0);
 if(Number.isFinite(length)&&length>maxBytes)return Response.json({error:"payload_too_large"},{status:413});
 return null;
}
