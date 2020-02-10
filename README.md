[![Run on Ainize](https://www.ainize.ai/static/images/run_on_ainize_button.svg)](https://ainize.web.app/redirect?git_repo=github.com/liayoo/ainize-with-ainjs-example)

# Ainize x ain-js Example
You can set values on AIN Blockchain Testnet.

## Set an environment variable
Add a private key at the ENV instruction in the Dockerfile.
```
ENV PRIVATE_KEY={your-private-key}
```

## Docker build
```
docker build -t ${YOUR_DOCKER_HUB_ID}/ainize-with-ainjs .
```

## Docker run
```
docker run -p 80:80 -d ${YOUR_DOCKER_HUB_ID}/ainize-with-ainjs
```
The server will be available at: http://localhost:80
- `/` Will return 'hello world'
- `/set_value?value={a-value-you-want-to-record}` Will send a set_value transaction to AIN Blockchain and return a response.
