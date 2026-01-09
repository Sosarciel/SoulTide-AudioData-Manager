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

        const maxLossG   = Math.max(...lossset.map(({lossG  }) => lossG));
        const maxLossMel = Math.max(...lossset.map(({lossMel}) => lossMel));
        const maxLossFm  = Math.max(...lossset.map(({lossFm }) => lossFm));
        const maxLossD   = Math.max(...lossset.map(({lossD  }) => lossD));
        const maxLossDur = Math.max(...lossset.map(({LossDur}) => LossDur));
        const maxLossKl  = Math.max(...lossset.map(({lossKl }) => lossKl));

        const avgLossG   = avg(...lossset.map(({lossG  }) => lossG));
        const avgLossMel = avg(...lossset.map(({lossMel}) => lossMel));
        const avgLossFm  = avg(...lossset.map(({lossFm }) => lossFm));
        const avgLossD   = avg(...lossset.map(({lossD  }) => lossD));
        const avgLossDur = avg(...lossset.map(({LossDur}) => LossDur));
        const avgLossKl  = avg(...lossset.map(({lossKl }) => lossKl));

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