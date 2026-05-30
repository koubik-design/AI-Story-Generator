const path = require('path');
const os = require('os');
const fs = require('fs').promises;
const { execFile } = require('child_process');

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
const HUGGINGFACE_HUB_TOKEN = process.env.HUGGINGFACE_HUB_TOKEN;
const HUGGINGFACE_TOKEN = HUGGINGFACE_API_KEY || HUGGINGFACE_HUB_TOKEN;
const HUGGINGFACE_MODEL_ID = process.env.HUGGINGFACE_MODEL_ID || 'Qwen/Qwen-3.0';
const HUGGINGFACE_API_URL = `https://api-inference.huggingface.co/models/${HUGGINGFACE_MODEL_ID}`;
const HF_CLI_PATH_DIR = process.env.HF_CLI_PATH || path.join(os.homedir(), '.local', 'bin');

function getFetch() {
  if (typeof fetch !== 'undefined') {
    return fetch;
  }

  try {
    return require('node-fetch');
  } catch (error) {
    throw new Error('Fetch is not available in this environment. Use Node 18+ or install node-fetch.');
  }
}

function buildPrompt(prompt) {
  return prompt.trim();
}

function getHfExecEnv() {
  return {
    ...process.env,
    PATH: `${HF_CLI_PATH_DIR}:${process.env.PATH || ''}`,
  };
}

async function execHfCommand(args, options = {}) {
  return new Promise((resolve, reject) => {
    execFile('hf', args, { env: getHfExecEnv(), ...options }, (error, stdout, stderr) => {
      if (error) {
        return reject(new Error(`hf ${args.join(' ')} failed: ${stderr || error.message}`));
      }
      resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
    });
  });
}

async function verifyHfCli() {
  try {
    await execHfCommand(['--version']);
    return true;
  } catch (error) {
    return false;
  }
}

async function syncBucket(sourceUri, destinationPath) {
  if (!sourceUri || !destinationPath) {
    throw new Error('Both source URI and destination path are required for bucket sync.');
  }

  const hfInstalled = await verifyHfCli();
  if (!hfInstalled) {
    throw new Error('Hugging Face CLI is not installed or not available in PATH. Install it with `curl -LsSf https://hf.co/cli/install.sh | bash`.');
  }

  await fs.mkdir(path.dirname(destinationPath), { recursive: true });
  const { stdout } = await execHfCommand(['sync', sourceUri, destinationPath]);
  return stdout;
}

async function uploadFolderToBucket(localPath, bucketUri) {
  if (!localPath || !bucketUri) {
    throw new Error('Local path and bucket URI are required to upload files.');
  }

  const hfInstalled = await verifyHfCli();
  if (!hfInstalled) {
    throw new Error('Hugging Face CLI is not installed or not available in PATH. Install it with `curl -LsSf https://hf.co/cli/install.sh | bash`.');
  }

  const { stdout } = await execHfCommand(['sync', localPath, bucketUri]);
  return stdout;
}

async function downloadBucketToLocal(bucketUri, localPath) {
  if (!bucketUri || !localPath) {
    throw new Error('Bucket URI and local path are required to download a bucket.');
  }

  const hfInstalled = await verifyHfCli();
  if (!hfInstalled) {
    throw new Error('Hugging Face CLI is not installed or not available in PATH. Install it with `curl -LsSf https://hf.co/cli/install.sh | bash`.');
  }

  await fs.mkdir(localPath, { recursive: true });
  const { stdout } = await execHfCommand(['sync', bucketUri, localPath]);
  return stdout;
}

async function callHuggingFace(prompt, options = {}) {
  if (!HUGGINGFACE_TOKEN) {
    throw new Error('HUGGINGFACE_API_KEY or HUGGINGFACE_HUB_TOKEN environment variable is not set.');
  }

  if (!prompt || !prompt.trim()) {
    throw new Error('Prompt is required to generate text.');
  }

  const fetch = getFetch();
  const response = await fetch(HUGGINGFACE_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${HUGGINGFACE_TOKEN}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      inputs: buildPrompt(prompt),
      parameters: {
        max_new_tokens: options.maxNewTokens ?? 512,
        temperature: options.temperature ?? 0.7,
        top_p: options.topP ?? 0.95,
        return_full_text: false,
      },
    }),
  });

  const body = await response.text();
  if (!response.ok) {
    throw new Error(`HuggingFace API error (${response.status}): ${body}`);
  }

  let data;
  try {
    data = JSON.parse(body);
  } catch (error) {
    throw new Error(`Failed to parse HuggingFace response: ${error.message}`);
  }

  if (data.error) {
    throw new Error(`HuggingFace API error: ${data.error}`);
  }

  if (Array.isArray(data) && data.length > 0) {
    const first = data[0];
    if (typeof first === 'string') {
      return first;
    }

    if (typeof first === 'object') {
      return first.generated_text || first.text || JSON.stringify(first);
    }
  }

  if (typeof data === 'object') {
    return data.generated_text || data.text || JSON.stringify(data);
  }

  return String(data);
}

async function generateStory(prompt, options = {}) {
  return callHuggingFace(prompt, options);
}

module.exports = {
  generateStory,
  syncBucket,
  uploadFolderToBucket,
  downloadBucketToLocal,
};
