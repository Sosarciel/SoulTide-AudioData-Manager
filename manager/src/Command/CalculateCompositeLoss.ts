import { Command } from 'commander';
import fs from 'fs';


const mulweight = (base:number,avg:number,weight:number)=>{
    const np = 1/weight;
    const smooth = np*avg;
    return (base + smooth) / np;
}
const avg = (...numbers:number[]) =>{
    const sum = numbers.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
    const average = sum / numbers.length;
    return average;
}

type LossSet = {
    /**评判器 loss */
    lossD: number;
    /**生成器 loss 生成语调与细节更好 */
    lossG: number;
    /**特征 loss */
    lossFm: number;
    /**梅尔频谱 loss 生成更准更自然符合人耳 */
    lossMel: number;
    /**时长 loss */
    LossDur: number;
    /**KL loss */
    lossKl: number;
    step: number;
    lr: number;
}
export const CmdCalculateVITSLoss = (program: Command) => program
    .command("Calculate-VITSLoss")
    .alias("calculatevitsloss")
    .alias("calcvitsloss")
    .description("根据filelist产生srt")
    .argument('<logPath>', '输入的log路径')
    .option('-c, --count <count>', '取前count个', parseInt, 10)
    .option('-m, --min <step>', '最小step', parseInt, 0)
    .action(async (logPath:string,{count,min}) => {
        const logtext = await fs.promises.readFile(logPath,'utf-8');
        const lossset = logtext.replace(/\r\n/g,'\n').split('\n')
            .filter(line=>(/INFO\t\[/).test(line))
            .map(line=>line.replace(/^.+INFO\t/,''))
            .map(line=>JSON.parse(line))
            .map(([lossD,lossG,lossFm,lossMel,LossDur,lossKl,step,lr])=>
                ({lossD,lossG,lossFm,lossMel,LossDur,lossKl,step,lr}))
            .filter(({step})=>step>min);

        const maxLossG   = Math.max(...lossset.map(v => v.lossG   ));
        const maxLossMel = Math.max(...lossset.map(v => v.lossMel ));
        const maxLossFm  = Math.max(...lossset.map(v => v.lossFm  ));
        const maxLossD   = Math.max(...lossset.map(v => v.lossD   ));
        const maxLossDur = Math.max(...lossset.map(v => v.LossDur ));
        const maxLossKl  = Math.max(...lossset.map(v => v.lossKl  ));

        const avgLossG   = avg(...lossset.map(v => v.lossG   ));
        const avgLossMel = avg(...lossset.map(v => v.lossMel ));
        const avgLossFm  = avg(...lossset.map(v => v.lossFm  ));
        const avgLossD   = avg(...lossset.map(v => v.lossD   ));
        const avgLossDur = avg(...lossset.map(v => v.LossDur ));
        const avgLossKl  = avg(...lossset.map(v => v.lossKl  ));

        const weightGen = 1;
        const weightMel = 0.7;
        const weightFm  = 0.4;
        const weightD   = 0.2;
        const other     = 0.1;

        const mulval = lossset.map(({lossD,lossG,lossFm,lossMel,LossDur,lossKl,step,lr},idx)=>{
                const compositeLoss =
                    mulweight(lossG   , avgLossG  ,weightGen ) *
                    mulweight(lossMel , avgLossMel,weightMel ) *
                    mulweight(lossFm  , avgLossFm ,weightFm  ) *
                    mulweight(lossD   , avgLossD  ,weightD   ) *
                    mulweight(LossDur , avgLossDur,other     ) *
                    mulweight(lossKl  , avgLossKl ,other     );
                return {
                    compositeLoss,
                    step,
                    lossD,lossG,lossFm,lossMel,LossDur,lossKl,
                }
            }).sort( (a,b) => a.compositeLoss - b.compositeLoss).filter((_,i)=>i<count);
        const addval = lossset.map(({lossD,lossG,lossFm,lossMel,LossDur,lossKl,step,lr},idx)=>{
                const compositeLoss =
                    (weightGen / maxLossG   * lossG  ) +
                    (weightMel / maxLossMel * lossMel) +
                    (weightFm  / maxLossFm  * lossFm ) +
                    (weightD   / maxLossD   * lossD  ) +
                    (other     / maxLossDur * LossDur) +
                    (other     / maxLossKl  * lossKl );
                return {
                    compositeLoss,
                    step,
                    lossD,lossG,lossFm,lossMel,LossDur,lossKl,
                }
            }).sort( (a,b) => a.compositeLoss - b.compositeLoss).filter((_,i)=>i<count);;

        console.table('mul');
        console.table(mulval);
        console.table('add');
        console.table(addval);
    })