import { PromiseQueue, sleep, UtilHttp } from '@zwa73/utils';
import path from 'pathe';
import { ROOT_PATH } from './Define';
import { spawn } from 'child_process';

const postTool = UtilHttp
    .url('http://127.0.0.1:4242/japanese_cleaners')
    .postJson().finalize({});

let isStart:Promise<void>|null = null as any;
const start = ()=> {
    if(isStart!=null) return isStart;
    isStart = new Promise<void>((resolve, reject) => {
        const serverProcess = spawn('cmd.exe', ['/c', `${path.join(ROOT_PATH, 'start_python_server.bat')}`]);

        process.on('exit', () => {
            serverProcess.kill();
        });

        process.on('SIGINT', () => {
            serverProcess.kill();
            process.exit();
        });
        process.on('SIGTERM', () => {
            serverProcess.kill();
            process.exit();
        });

        serverProcess.stdout.on('data', (data) => {
            console.log(`Server stdout: ${data}`);
            if (data.toString().includes('Running on')) {
                console.log("Server started successfully");
                resolve();
            }
        });

        serverProcess.stderr.on('data', async (data) => {
            console.error(`Server stderr: ${data}`);
            if (data.toString().includes('Running on')) {
                console.log("Server started with stderr");
                const response1 = await postTool.once({ text: 'sssss' });
                console.log('testresp1',response1?.data);
                const response2 = await postTool.once({ text: 'aaaaa' });
                console.log('testresp2',response2?.data);
                const response3 = await postTool.once({ text: 'bbbbb' });
                console.log('testresp3',response3?.data);
                resolve();
            }
        });

        serverProcess.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Server process exited with code ${code}`));
            }
        });
    });
    return isStart;
}

const queue = new PromiseQueue({maxConcurrent:1});
export async function japanese_cleaners(inputText:string) {
    //await start();
    try{
        const response = await queue.enqueue(
            async () => postTool.once({ text: inputText })
        );
        const data = response?.data as { result: string };
        console.log(data)
        //const response = await axios.post('http://127.0.0.1:4242/japanese_cleaners', { text: inputText })
        return data.result as string;
    }catch(e){
        console.log('无法解析',inputText);
        return '';
    }
}

if(false) (async ()=>{
    const list = [
        "他に何したい?",
        "うち、何でも付き合うよ",
        "一日中ゲーム付けだったし、何か別のことしない?",
        "いや、ただベランダで風にあたろうって意味だけど、また変なこと考えたでしょう。",
    ]

    const a100 = Array.from({length:100}).fill(undefined);

    await Promise.all(list.map(async (v,idx) => {
        console.log(await japanese_cleaners(v));
    }));
    console.log('complete');
})();


//(async()=>{
//    console.log(1)
//    for(let i=0;i<100;i++){
//        const res = await japanese_cleaners("sssssssss")
//        console.log(res)
//    }
//})()