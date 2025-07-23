conda activate ./minconda
Start-Sleep -Seconds 1
python -m uvicorn python_server.server:app --host 127.0.0.1 --port 4242 --workers 4