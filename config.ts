import { readdirSync, lstatSync } from 'fs';
import { existsSync, readFile, writeFile } from 'fs-extra';
import path from 'path'
import os from 'os'
import yaml from 'js-yaml'
const CONFIG_FILE_NAME = '.cloud-torrent-config'

export async function getShowsInfo() {
  const mainConfig:any = await getMainConfig()
  const {sources} = mainConfig
  const showpaths = {}

  for (const source of sources) {
    const subdirectories = getSubdirectories(source.path)
    for (const subdirectoryPath of subdirectories) {
      showpaths[path.basename(subdirectoryPath)] = subdirectoryPath
    }
  }

  const showsInfo = {}
}

async function getShowInfo(sourcePath, configFileName) {

}

async function getMainConfig() {
  const mainConfigFilePath = getConfigFilePath(os.homedir())
  const mainStartConfig = {
    sources: [
      {
        path: __dirname + '/_videos',
      },
    ]
  }
  return readConfigFile(mainConfigFilePath, mainStartConfig)
}

async function getSubConfigs(source, CONFIG_FILE_NAME) {
  const subdirectories = getSubdirectories(source)
  return subdirectories
    .filter(subPath => (path.basename(subPath) !== "Movies"))
    .map(subDirPath => getSubConfig(subDirPath))
}

async function getSubConfig(subDirPath) {
  const configFilePath = getConfigFilePath(subDirPath)
  return {
    path: subDirPath,
    config: readConfigFile(configFilePath, {}),
  }
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


function isDirectory (source) {
  return lstatSync(source).isDirectory()
}

function getSubdirectories (source) {
  return readdirSync(source).map(name => path.join(source, name)).filter(isDirectory)
}

function getConfigFilePath(dir) {
  return path.resolve(dir, CONFIG_FILE_NAME)
}