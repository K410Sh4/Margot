/* Margot V1.27 — normalização compartilhada de estoque, etiquetas e descontos.
 * Fonte: dados explícitos e confirmados em merchandising-data.js; sem métricas inventadas.
 */
(() => {
  'use strict';
  const catalog=window.MargotCatalog;
  if(!catalog||!Array.isArray(catalog.products))return;
  const source=window.MargotCommercialData?.products||{};
  const day=/^\d{4}-\d{2}-\d{2}$/;
  const now=Date.now();
  const isoToday=new Date(now).toISOString().slice(0,10);
  const currentMonth=isoToday.slice(0,7);
  const moneyValid=value=>Number.isFinite(value)&&value>0&&Math.abs(Math.round(value*100)-value*100)<0.000001;
  function validDate(value){
    if(typeof value!=='string'||!day.test(value))return null;
    const time=Date.parse(value+'T00:00:00Z');
    if(!Number.isFinite(time)||new Date(time).toISOString().slice(0,10)!==value)return null;
    return time;
  }
  function recent(value,maximumDays){
    const time=validDate(value);
    if(time===null)return false;
    const difference=now-time;
    return difference>=-86400000&&difference<=(maximumDays+1)*86400000;
  }
  function confirmed(entry){return Boolean(entry&&entry.confirmed===true&&
    typeof entry.source==='string'&&entry.source.trim().length>=5);}
  function enrich(p){
    const raw=Object.prototype.hasOwnProperty.call(source,p.id)&&source[p.id]&&typeof source[p.id]==='object'
      ?source[p.id]:{};
    const inventory=raw.inventory;
    const stock=confirmed(inventory)&&recent(inventory.checkedAt,7)&&
      Number.isInteger(inventory.quantity)&&inventory.quantity>=0&&inventory.quantity<=1000000
      ?inventory.quantity:null;
    const offer=raw.promotion;
    const original=offer?.originalPrice;
    const sale=offer?.salePrice;
    const promotion=confirmed(offer)&&recent(offer.checkedAt,30)&&
      validDate(offer.startsAt)!==null&&validDate(offer.endsAt)!==null&&
      offer.startsAt<=isoToday&&offer.endsAt>=isoToday&&
      moneyValid(original)&&moneyValid(sale)&&
      original>sale?Object.freeze({
        originalPrice:original,
        salePrice:sale,
        percent:Math.round((1-sale/original)*100),
        endsAt:offer.endsAt
      }):null;
    const tags=raw.tags;
    const validTags=confirmed(tags)&&recent(tags.checkedAt,35);
    const labels=[];
    if(validTags&&tags.favorite===true)labels.push('favorite');
    if(validTags&&tags.bestSellerMonth===currentMonth)labels.push('bestSeller');
    if(promotion)labels.push('discount');
    return Object.freeze({
      ...p,
      referencePrice:p.price,
      price:promotion?promotion.salePrice:p.price,
      promotion,
      stock,
      stockCheckedAt:stock===null?null:inventory.checkedAt,
      labels:Object.freeze(labels)
    });
  }
  const products=Object.freeze(catalog.products.map(enrich));
  window.MargotCatalog=Object.freeze({...catalog,products});
  const promotions=Object.freeze(products.filter(p=>p.promotion));
  window.MargotMerchandising=Object.freeze({
    promotions,
    lowStock: p=>Number.isInteger(p?.stock)&&p.stock>=1&&p.stock<=10,
    badgeText:Object.freeze({
      favorite:'Peça favorita',
      bestSeller:'Mais vendida do mês',
      discount:'Oferta'
    }),
    isoToday
  });
})();
