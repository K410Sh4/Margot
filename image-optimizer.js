/* Margot V1.30 — compressão local para fotos de produto no plano Spark.
 * Fotos completas ficam em documentos separados do Firestore (máx. 160 KiB);
 * somente miniaturas WebP (máx. 18 KiB) ficam no documento de produto.
 * Não utiliza Storage nem envia arquivos para terceiros.
 */
(() => {
  'use strict';
  const MAX_FILE=5*1024*1024;
  const FULL_TARGET=160*1024;
  const THUMB_TARGET=18*1024;
  const ALLOWED=new Set(['image/png','image/jpeg','image/webp']);
  const MAX_DIMENSIONS=[1000,900,800,700,620,520];
  const QUALITIES=[.88,.76,.66,.56,.45,.34];

  function canvasOutput(canvas,quality){
    return new Promise((resolve,reject)=>{
      canvas.toBlob(blob=>blob?.type==='image/webp'?
        resolve(blob):reject(Error('Este navegador não oferece suporte à compactação WebP.')), 'image/webp',quality);
    });
  }
  function dataUrl(blob){
    return new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onload=()=>resolve(reader.result);
      reader.onerror=()=>reject(Error('Não foi possível ler a fotografia compactada.'));
      reader.readAsDataURL(blob);
    });
  }
  function draw(bitmap,maxDim){
    const scale=Math.min(1,maxDim/Math.max(bitmap.width,bitmap.height));
    const width=Math.max(1,Math.round(bitmap.width*scale));
    const height=Math.max(1,Math.round(bitmap.height*scale));
    const canvas=document.createElement('canvas');
    canvas.width=width;canvas.height=height;
    const ctx=canvas.getContext('2d',{alpha:true});
    if(!ctx)throw Error('Não foi possível preparar a fotografia.');
    ctx.imageSmoothingEnabled=true;
    ctx.imageSmoothingQuality='high';
    ctx.drawImage(bitmap,0,0,width,height);
    return canvas;
  }
  async function encode(bitmap,target,dimensions){
    for(const max of dimensions){
      const canvas=draw(bitmap,max);
      for(const quality of QUALITIES){
        const blob=await canvasOutput(canvas,quality);
        if(blob.size<=target){
          return {
            data:await dataUrl(blob),bytes:blob.size,
            width:canvas.width,height:canvas.height
          };
        }
      }
    }
    throw Error('A fotografia é detalhada demais para a cota gratuita. Use uma imagem mais simples ou menor.');
  }
  async function optimize(file){
    if(!file||!ALLOWED.has(file.type)||file.size<1||file.size>MAX_FILE){
      throw Error('Envie uma imagem JPEG, PNG ou WebP de até 5 MB.');
    }
    const bitmap=await createImageBitmap(file);
    try{
      if(bitmap.width<100||bitmap.height<100){
        throw Error('A fotografia precisa ter pelo menos 100 pixels de largura e altura.');
      }
      const full=await encode(bitmap,FULL_TARGET,MAX_DIMENSIONS);
      const thumb=await encode(bitmap,THUMB_TARGET,[260,220,180,160]);
      return Object.freeze({full,thumb});
    }finally{bitmap.close?.()}
  }
  window.MargotImageTools=Object.freeze({optimize,MAX_FILE,FULL_TARGET,THUMB_TARGET});
})();
