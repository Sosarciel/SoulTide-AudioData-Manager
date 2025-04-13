import { japanese_cleaners } from "./Bridge";

void((async()=>{
    console.log(1);
    const result = await japanese_cleaners('バトルではわたくし達が「キャラ」として戦います。');
    console.log(result);
    console.log('ba↓torudewa wa↑takUʃi↓taʧiga[ kya↓ra] t o ʃI↑te ta↑takaima↓sU.');
})())