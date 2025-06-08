import { Bold, Columns, Disclosure, IconAdjust32, IconButton, Muted, Stack, Textbox } from '@create-figma-plugin/ui';
import { h } from 'preact';
import { useState } from 'preact/hooks';

type Props = {};

// public/{...projectName}/object
// src/[locale]/{...projectName}/icon
// projectName : event,new-year 처럼 구성 > path 자동완성 처리

type PathOptions = {
  /**
   * public/event/new-year/object/~
   * public/event/new-year/svg/~
   * public/event/new-year/asset.svg
   * "event","new-year" 로 구성 가능
   */
  assetPath: string[];
  /**
   * src/[locale]/{...projectName}
   * "src","[locale]", "event","new-year" 로 구성 가능
   * "src/[locale]/event/new-year/" 폴더로 생성한다는 뜻
   * src 랑
   * src/[locale] 까지는 프리셋
   */
  codePath: string[];
};

const Header = (props: Props) => {
  const [open, setOpen] = useState<boolean>(false);
  const [value, setValue] = useState<string>('Text');
  function handleValueInput(newValue: string) {
    console.log(newValue);
    setValue(newValue);
  }
  return (
    <div>
      <div>
        <Disclosure onClick={(e) => setOpen((state) => !state)} open={open} title="Path Setting">
          <Stack space="extraSmall">
            <Columns>
              <Muted>Asset Path : </Muted>
              <Bold>Icon Path</Bold>
            </Columns>
          </Stack>
        </Disclosure>

        <IconButton onClick={console.log}>
          <IconAdjust32 />
        </IconButton>
      </div>

      <div>
        <Textbox onValueInput={handleValueInput} value={value} variant="underline" />
      </div>
    </div>
  );
};

export default Header;
