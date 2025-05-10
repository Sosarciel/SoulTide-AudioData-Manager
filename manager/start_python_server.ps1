conda activate ./minconda
hypercorn -w 4 --bind 127.0.0.1:4242 python_server.server:app