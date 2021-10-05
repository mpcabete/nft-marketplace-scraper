import fetch from 'node-fetch';
import {csvFormat} from 'd3-dsv';
const project = 'yummiuniverse'
const page = 1

async function main(){

  const cnftToolsData = await cnftTools()
  const ioData = await cnftIo()
  // console.log(JSON.stringify(ioData.assets,null,4))
  const prices = getPrices(ioData)
  const mergedData = cnftToolsData.stats.map(injectPrice)
  // console.log('cnftToolsData',csvFormat(mergedData))

  function injectPrice(obj){
    const objHash = obj.url
    const price = prices.find(x=>{
      console.log(x.hash,objHash)
      return x.hash === objHash
    })
    console.log('price',price)
    obj.price = price 
    return obj
  }
  function getPrices(ioData){
    return ioData.assets.map(x=>{
        return { hash:x.metadata.thumbnail.slice(-46) , price:x.price }
        
      })
  }

  async function cnftTools(){
    const uri = `https://cnft.tools/api/${project}?background=x&body=x&face=x&headwear=x&sort=ASC&method=rarity&page=${page}&`
    const response = await fetch(uri);
    const data = await response.json();
    return data
  }

  async function cnftIo(){

    const form = {
      search: "",
      sort: "date",
      order: "desc",
      page: 1,
      verified: true,
      project: "Yummi Universe - Naru",
    };

    const params = new URLSearchParams(form);
    

    const response = await fetch('https://api.cnft.io/market/listings', {method: 'POST', body: params});
    const data = await response.json()
    return data
  }
}
main()

// project list endpoint
// https://api.cnft.io/market/projects 
//
//
// pool.io 
// https://api.cnft.io/market/listings
// type - post
// fetch("https://api.cnft.io/market/listings", {
//   "headers": {
//     "accept": "*/*",
//     "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
//     "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
//     "sec-fetch-dest": "empty",
//     "sec-fetch-mode": "cors",
//     "sec-fetch-site": "same-site",
//     "sec-gpc": "1"
//   },
//   "referrer": "https://cnft.io/",
//   "referrerPolicy": "strict-origin-when-cross-origin",
//   "body": "search=&sort=date&order=desc&page=1&verified=true&project=Yummi+Universe+-+Naru",
//   "method": "POST",
//   "mode": "cors"
// });
//
//
//
// checar manualmente se o hash como id da certo
// error handle nos fetch
// pensar numa organizaçao melhor
