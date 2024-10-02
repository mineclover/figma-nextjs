import { Disclosure } from "@create-figma-plugin/ui";

import { ComponentChildren, h } from "preact";
import { useState } from "react";

type Props = {
  name: string;
  children: ComponentChildren;
};

const FolderableError = ({ name, children }: Props) => {
  const [open, setOpen] = useState<boolean>(false);
  return (
    <Disclosure
      onClick={(event) => {
        setOpen(!(open === true));
      }}
      open={open}
      title={name}
    >
      {children}
    </Disclosure>
  );
};

export default FolderableError;
