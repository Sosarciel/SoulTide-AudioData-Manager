import { sleep, SLogger, UtilFunc } from '@zwa73/utils';
import axios from 'axios';
import path from 'pathe';
import { ROOT_PATH } from './Define';
import { spawn } from 'child_process';

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
                const response1 = await axios.post('http://127.0.0.1:4242/japanese_cleaners', { text: 'sssss' });
                console.log('testresp1',response1.data.result);
                const response2 = await axios.post('http://127.0.0.1:4242/japanese_cleaners', { text: 'aaaaa' });
                console.log('testresp2',response2.data.result);
                const response3 = await axios.post('http://127.0.0.1:4242/japanese_cleaners', { text: 'bbbbb' });
                console.log('testresp3',response3.data.result);
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

let index= 0;
const getIdx = ()=> {
    index++;
    if(index>=4)
        index=0;
    return index;
}

export async function japanese_cleaners(inputText:string) {
    //await start();
    try{
        const response = await UtilFunc.queueProc(
            `japanese_cleaners_${getIdx()}`,
            async ()=>await axios.post('http://127.0.0.1:4242/japanese_cleaners', { text: inputText })
        );
        //const response = await axios.post('http://127.0.0.1:4242/japanese_cleaners', { text: inputText })
        return response.data.result as string;
    }catch(e){
        console.log('无法解析',inputText);
        return '';
    }
}


//(async()=>{
//    console.log(1)
//    for(let i=0;i<100;i++){
//        const res = await japanese_cleaners("sssssssss")
//        console.log(res)
//    }
//})()