import fs from 'fs'
import { existsSync, readFile, writeFile } from 'fs-extra';
import path from 'path'
import os from 'os'
import yaml from 'js-yaml'
const CONFIG_FILE_NAME = '.cloud-torrent-config'


export async function getMainConfig() {
  const mainConfigFilePath = getConfigFilePath(os.homedir())
  const defaultMainConfig = {
    sources: [
      {
        path: __dirname + '/_videos',
      },
    ]
  }
  return readConfigFile(mainConfigFilePath, defaultMainConfig)
}

export async function saveMainConfig(config) {
  const mainConfigFilePath = getConfigFilePath(os.homedir())
  await writeFile(mainConfigFilePath, yaml.safeDump(config))
}

async function readConfigFile(configFilePath, alternative) {
  let config
  if (existsSync(configFilePath)) {
    config = yaml.safeLoad((await readFile(configFilePath)).toString())
  } else {
    config = alternative
    await writeFile(configFilePath, yaml.safeDump(config))
  }
  return config
}


function getConfigFilePath(dir) {
  return path.resolve(dir, CONFIG_FILE_NAME)
}

function copy(original, destination) {
  return new Promise((res, rej) => {
    var readStream = fs.createReadStream(original);
    var writeStream = fs.createWriteStream(destination);

    readStream.on('error', rej);
    writeStream.on('error', rej);

    readStream.on('close', res);

    readStream.pipe(writeStream);
  })
}