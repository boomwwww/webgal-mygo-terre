import * as React from 'react';
import { Popover, PopoverSurface, PopoverTrigger, ToolbarButton, Text } from '@fluentui/react-components';
import { config } from '@/config/mygo';
import style from './versionInfo.module.scss';
import { bundleIcon, InfoFilled, InfoRegular } from '@fluentui/react-icons';
import { useEffect } from 'react';
import useEditorStore from '@/store/useEditorStore';
import { api } from '@/api';
import { IFile } from '@/components/Assets/Assets';
import axios from 'axios';

const InfoIcon = bundleIcon(InfoFilled, InfoRegular);

interface WebgalEngineManifest {
  name?: string;
  version?: string;
  type?: string;
  webgalVersion?: string;
}

const versionMap: Map<string, string> = new Map([
  ['index-66c73d99.js', 'MyGO v2.2'],
  ['index-9926f23f.js', 'MyGO v2.3'],
  ['index-05642ad2.js', 'MyGO v2.4'],
  ['index-089fab66.js', 'MyGO v2.5'],
  ['index-e1b3c40e.js', 'MyGO v3.0.0'],
  ['index-1b91f010.js', 'MyGO v3.1.0'],
  ['index-982c8eaa.js', 'MyGO v3.1.1'],
]);

const VersionInfo: React.FunctionComponent = () => {
  const [open, setOpen] = React.useState(false);
  const [engineVersion, setEngineVersion] = React.useState(`未知`);
  const [engineBaseVersion, setEngineBaseVersion] = React.useState<string | null>(null);
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

  async function identifyByFingerprint(): Promise<string | null> {
    const mainJsFileName = await getMainJsFileName(`games/${gameDir}/assets`);
    if (mainJsFileName) {
      return versionMap.get(mainJsFileName) ?? null;
    }
    return null;
  }

  async function fetchEngineVersion() {
    // ① 指纹优先：老专版引擎（MyGO 2.2 ~ 3.1.1）的 index-*.js 命中 versionMap
    const fingerprinted = await identifyByFingerprint();
    if (fingerprinted) {
      setEngineVersion(fingerprinted);
      setEngineBaseVersion(null);
      return;
    }

    // ② 新方法：读取 webgal-engine.json（原版 4.6.0 / 专版 3.2.0 起）
    try {
      const res = await axios.get<WebgalEngineManifest>(`/games/${gameDir}/webgal-engine.json`);
      const manifest = res.data;
      if (manifest && (manifest.version || manifest.webgalVersion)) {
        const baseVersion = manifest.webgalVersion ?? manifest.version;
        if (manifest.type === 'custom') {
          const customName = manifest.name ?? 'Custom';
          setEngineVersion(`${customName} v${manifest.version}`);
          setEngineBaseVersion(`based on WebGAL v${baseVersion}`);
        } else {
          setEngineVersion(`WebGAL v${baseVersion}`);
          setEngineBaseVersion(null);
        }
        return;
      }
    } catch (error) {
      console.warn('webgal-engine.json 读取失败:', error);
    }

    // ③ 新旧方式都无法识别
    setEngineVersion('无法识别');
    setEngineBaseVersion(null);
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
        <ToolbarButton className={style.trigger} aria-label={'版本信息'} icon={<InfoIcon />}>
          <Text>{'版本信息'}</Text>
        </ToolbarButton>
      </PopoverTrigger>
      <PopoverSurface>
        <div style={{ display: "flex", flexFlow: "column", gap: "12px" }}>
          <div style={{ display: "flex", flexFlow: "column" }}>
            <Text className={style.versionTitle}>{'引擎版本:'}</Text>
            <Text className={style.versionNumber}>{engineVersion}</Text>
            {engineBaseVersion && <Text className={style.versionBase}>{engineBaseVersion}</Text>}
          </div>
          <div style={{ display: "flex", flexFlow: "column" }}>
            <Text className={style.versionTitle}>{'编辑器版本:'}</Text>
            <Text className={style.versionNumber}>{`MyGO v${config.version}`}</Text>
          </div>
          <div style={{ borderTop: '1px solid var(--black-10pct)', margin: '4px 0' }} />
          <Text className={style.tip}>{`通常推荐使用「相同版本」的引擎和编辑器, 或者编辑器版本略高于引擎版本`}</Text>
          <Text className={style.tip}>{`如果引擎版本未知, 可能是以下原因导致的:`}</Text>
          <Text className={style.tip}>{`- 我们没有收录除 MyGO 引擎以外的引擎`}</Text>
          <Text className={style.tip}>{`- 我们没有收录比 MyGO 2.2 更早的版本`}</Text>
          <Text className={style.tip}>{`- 我们漏收录了一些特殊版本`}</Text>
        </div>
      </PopoverSurface>
    </Popover>
  );
};

export default VersionInfo;
