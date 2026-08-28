import GameElement from "./GameElement";
import styles from "./sidebar.module.scss";
import {useEffect, useRef, useState} from "react";
import {
  Button, Checkbox, Dropdown,
  Input,
  Option,
  Popover,
  PopoverSurface,
  PopoverTrigger,
  Select,
  Subtitle1
} from "@fluentui/react-components";
import {AddFilled, AddRegular, ArrowSyncFilled, ArrowSyncRegular, bundleIcon} from "@fluentui/react-icons";
import {t} from "@lingui/macro";
import useSWR from "swr";
import {api} from "@/api";
import {CreateGameDto, GameInfoDto} from "@/api/Api";
import normalizeFileName from "@/utils/normalizeFileName";
import { config } from "@/config/mygo";

interface ISidebarProps {
  gameList: GameInfoDto[];
  currentSetGame: string | null;
  setCurrentGame: (currentGame: string) => void;
  createGame: (createGameData: CreateGameDto) => void;
  refreash?: () => void;
}

const AddIcon = bundleIcon(AddFilled, AddRegular);
const ArrowSyncIcon = bundleIcon(ArrowSyncFilled, ArrowSyncRegular);
const DEFAULT_TEMPLATE_DIR = 'WebGAL_Default_Template';

export default function Sidebar(props: ISidebarProps) {

  const [createGameFormOpen, setCreateGameFormOpen] = useState(false);
  const [gameName, setGameName] = useState(t`新的游戏`);
  const [gameDir, setGameDir] = useState(t`新的游戏`);
  const [derivative, setDerivative] = useState<string | undefined>(undefined);
  const [templateDir, setTemplateDir] = useState<string | undefined>(undefined);
  const [ignoreTemplate, setIgnoreTemplate] = useState<boolean>(true);
  const derivativeUserSet = useRef(false);
  const templateUserSet = useRef(false);

  // 可用的衍生版
  const derivativeEnginesResp = useSWR('derivativeEngines', async () => {
    const resp = await api.manageGameControllerGetDerivativeEngines();
    return resp.data as unknown as string[];
  });

  useEffect(() => {
    if (derivativeUserSet.current) return;
    const mygoEngines = derivativeEnginesResp.data?.filter((e) => e.toLocaleLowerCase().includes('mygo')) || [];
    if (mygoEngines[0]) {
      const theMygoEngine = getMaxVersionFromString(mygoEngines);
      setDerivative(theMygoEngine);
    }
  }, [derivativeEnginesResp.data]);

  const templatesResp = useSWR('template-list-selector', async () => {
    const resp = await api.manageTemplateControllerGetTemplateList();
    return resp.data as unknown as { name: string; dir: string }[];
  });

  useEffect(() => {
    if (templateUserSet.current) return;
    const mygoTemplates = templatesResp.data?.filter((e) => e.name.toLocaleLowerCase().includes('mygo')) || [];
    if (mygoTemplates[0]) {
      const theMygoTemplate = getMaxVersionFromString(mygoTemplates.map(e => e.name));
      setTemplateDir(theMygoTemplate);
    }
  }, [templatesResp.data]);

  const DEFAULT_OPTION = '__DEFAULT__';
  const defaultTemplateName = 'WebGAL Refine 2026';

  const getTemplateDisplayName = (dir: string | undefined): string => {
    if (!dir) return defaultTemplateName;
    return templatesResp.data?.find(e => e.dir === dir)?.name ?? dir;
  };

  const getDerivativeDisplayName = (val: string | undefined): string => {
    if (!val) return t`WebGAL Standard`;
    return val;
  };

  const selector = <Dropdown value={getDerivativeDisplayName(derivative)}
    selectedOptions={[derivative ?? DEFAULT_OPTION]} onOptionSelect={(_, elem) => {
      derivativeUserSet.current = true;
      setDerivative(elem.optionValue === DEFAULT_OPTION ? undefined : elem.optionValue);
    }}>
    <Option key="default-engine" value={DEFAULT_OPTION}>{t`WebGAL Standard`}</Option>
    {(derivativeEnginesResp.data ?? []).map(e =>
      <Option key={e} value={e}>{e}</Option>
    )}
  </Dropdown>;

  const selectorTemplate = <Dropdown value={getTemplateDisplayName(templateDir)}
    selectedOptions={[templateDir ?? DEFAULT_OPTION]}
    onOptionSelect={(_, elem) => {
      templateUserSet.current = true;
      setTemplateDir(elem.optionValue === DEFAULT_OPTION ? undefined : elem.optionValue);
    }}>
    <Option key="default-template" value={DEFAULT_OPTION}>{defaultTemplateName}</Option>
    {(templatesResp.data ?? []).filter(e => e.dir !== DEFAULT_TEMPLATE_DIR).map(e =>
      <Option key={e.dir} value={e.dir}>{e.name}</Option>
    )}
  </Dropdown>;

  function createNewGame() {
    if (gameName.trim() !== '' && gameDir.trim() !== '' && !props.gameList.find((item) => item.dir === gameDir.trim())) {
      props.createGame({
        gameName: gameName.trim(),
        gameDir,
        derivative,
        templateDir,
        ignoreTemplate,
      });
      setCreateGameFormOpen(false);
      setGameName(t`新的游戏`);
    }
  }

  return <div className={`${styles.sidebar_main} ${!props.currentSetGame ? styles.sidebar_main_fullwidth : ""}`}>
    <div className={styles.sidebar_top}>
      <span className={styles.sidebar_top_title}>{t`游戏列表`}</span>
      <div className={styles.sidebar_top_buttons}>
        <Popover
          withArrow
          trapFocus
          open={createGameFormOpen}
          onOpenChange={() => setCreateGameFormOpen(!createGameFormOpen)}
        >
          <PopoverTrigger>
            <Button appearance='primary' icon={<AddIcon/>}>{t`新建游戏`}</Button>
          </PopoverTrigger>
          <PopoverSurface>
            <form style={{display: "flex", flexDirection: "column", gap: '16px'}}>
              <Subtitle1>{t`创建新游戏`}</Subtitle1>
              {t`游戏名称`}
              <Input
                value={gameName}
                onChange={(event) => {
                  setGameName(event.target.value);
                  gameDir === normalizeFileName(gameName) && setGameDir(normalizeFileName(event.target.value));
                }}
                onKeyDown={(event) => (event.key === 'Enter') && createNewGame()}
                defaultValue={t`新的游戏`}
                placeholder={t`游戏名称`}
              />
              {t`游戏目录`}
              <Input
                value={gameDir}
                onChange={(event) => setGameDir(event.target.value)}
                onKeyDown={(event) => (event.key === 'Enter') && createNewGame()}
                defaultValue={gameDir}
                placeholder={t`游戏目录`}
              />
              {t`选择游戏引擎版本`}
              <div style={{ fontSize: "12px", color: "var(--text-weak)" }}>{`推荐使用 MyGO_v${config.version}`}</div>
              {selector}
              <Checkbox
                checked={ignoreTemplate}
                onChange={(_, data) => setIgnoreTemplate(!!data.checked)}
                label={t`不应用模板`}
              />
              {!ignoreTemplate && (
                <>
                  {t`选择应用的模板`}
                  {selectorTemplate}
                </>
              )}
              <Button
                appearance='primary'
                disabled={
                  gameName.trim() === ''
                  || gameDir.trim() === ''
                  || props.gameList.find((item) => item.dir === gameDir.trim()) !== undefined
                }
                onClick={createNewGame}
              >
                {t`创建`}
              </Button>
            </form>
          </PopoverSurface>
        </Popover>
        <Button appearance='secondary' onClick={props.refreash} icon={<ArrowSyncIcon/>}/>
      </div>
    </div>
    <div className={styles.game_list}>
      {
        props.gameList.map(e => {
          const checked = props.currentSetGame === e.dir;
          return <GameElement
            onClick={() => props.setCurrentGame(e.dir)}
            refreash={props.refreash}
            gameInfo={e}
            key={e.dir}
            checked={checked}
          />;
        })
      }
    </div>
  </div>;
}

// 提取版本号
const getVersion = (version: string) => {
  const regex = /(\d+)\.(\d+)\.(\d+)/;
  const match = version.match(regex);
  if (match) {
    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10),
      patch: parseInt(match[3], 10),
    };
  }
  return null;
};

// 找到最大版本
const getMaxVersion = (versions:{major: number, minor: number, patch: number}[]) => {
  return versions.reduce((max, version) => {
    if (version.major > max.major) {
      return version;
    } else if (version.major === max.major && version.minor > max.minor) {
      return version;
    } else if (version.major === max.major && version.minor === max.minor && version.patch > max.patch) {
      return version;
    }
    return max;
  }, {major: 0, minor: 0, patch: 0});
};

// 由字符串获取最大版本号
export const getMaxVersionFromString = (versions: string[]) => {
  const versionArray = versions.map(version => getVersion(version)).filter(v => v !== null);
  const maxVersion = getMaxVersion(versionArray);
  const maxVersionString = `${maxVersion.major}.${maxVersion.minor}.${maxVersion.patch}`;
  return versions.find(v => v.includes(maxVersionString)) || versions[0];
};
