import * as React from 'react';
import { Popover, PopoverSurface, PopoverTrigger, ToolbarButton, Text } from '@fluentui/react-components';
import { config } from '@/config/mygo';
import style from './versionInfo.module.scss';
import { bundleIcon, InfoFilled, InfoRegular } from '@fluentui/react-icons';
import { useEffect } from 'react';
import useEditorStore from '@/store/useEditorStore';
import { api } from '@/api';
import { IFile } from '@/components/Assets/Assets';
import { __INFO } from '@/config/info';

const InfoIcon = bundleIcon(InfoFilled, InfoRegular);

const versionMap: Map<string, string> = new Map([
  ['index-66c73d99.js', 'MyGO_v2.2'],
  ['index-9926f23f.js', 'MyGO_v2.3'],
  ['index-05642ad2.js', 'MyGO_v2.4'],
  ['index-089fab66.js', 'MyGO_v2.5'],
  ['index-e1b3c40e.js', 'MyGO_v3.0.0'],
  ['index-1b91f010.js', 'MyGO_v3.1.0'],
]);

const VersionInfo: React.FunctionComponent = () => {
  const [open, setOpen] = React.useState(false);
  const [engineVersion, setEngineVersion] = React.useState(`未知`);
  const gameDir = useEditorStore.use.subPage();

  async function getMainJsFileName(path: string): Promise<string | null> {
    try {
      const res = await api.assetsControllerReadAssets(path);
      const data = res.data as unknown as object;
      if ('dirInfo' in data && data.dirInfo) {
        const dirInfo = data.dirInfo as IFile[];
        const mainJsFile = dirInfo.find(file => file.extName === '.js' && file.name.startsWith('index-'));
        return mainJsFile ? mainJsFile.name : null;
      } else {
        return null;
      }
    } catch (error) {
      console.error(`获取 ${path} 时出错:`, error);
      return null;
    }
  }

  async function fetchEngineVersion() {
    const mainJsFileName = await getMainJsFileName(`games/${gameDir}/assets`);
    if (mainJsFileName) {
      const version = versionMap.get(mainJsFileName) || `${mainJsFileName}(未知版本)`;
      setEngineVersion(version);
      return;
    }
    // 如果游戏目录下没有找到主 js 文件，一般代表正在使用默认引擎
    setEngineVersion(`WebGAL_v${__INFO.version}(默认)`);
  }

  useEffect(() => {
    fetchEngineVersion();
  }, []);

  return (
    <Popover
      withArrow
      trapFocus
      open={open}
      onOpenChange={() => setOpen(!open)}
    >
      <PopoverTrigger disableButtonEnhancement>
        <ToolbarButton className={style.trigger} aria-label={`版本信息`} icon={<InfoIcon />}>
          <Text className={style.versionTitle}>{`引擎版本:`}</Text>
          <Text className={style.versionNumber}>{engineVersion}</Text>
          <Text className={style.versionTitle}>{`编辑器版本:`}</Text>
          <Text className={style.versionNumber}>{`MyGO_v${config.version}`}</Text>
        </ToolbarButton>
      </PopoverTrigger>
      <PopoverSurface>
        <div style={{ display: "flex", flexFlow: "column", gap: "8px" }}>
          <Text className={style.tip}>{`通常推荐使用「相同版本」的引擎和编辑器, 或者编辑器版本略高于引擎版本`}</Text>
          <Text className={style.tip}>{`如果引擎版本未知, 可能是以下原因导致的:`}</Text>
          <Text className={style.tip}>{`- 我们没有收录除 MyGO 引擎以外的引擎`}</Text>
          <Text className={style.tip}>{`- 我们没有收录比 MyGO 2.2 更早的版本`}</Text>
          <Text className={style.tip}>{`- 我们漏收录了一些特殊版本`}</Text>
        </div>
      </PopoverSurface>
    </Popover>
  );
}

export default VersionInfo;
