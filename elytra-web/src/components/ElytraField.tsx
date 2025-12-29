import { Group, Field, InputGroup, Input, IconButton, Slider, HStack, Switch } from "@chakra-ui/react";
import { RefreshCwIcon } from "lucide-react";
import { DynamicIcon, IconName } from "lucide-react/dynamic";
import { FC } from "preact/compat";
import { FieldDesc, ValueTypes } from "../types";
import { fieldInputType } from "../util";
import { OptionElytraField } from "./OptionElytraField";

export interface Props {
  field: FieldDesc,
  value: string | number,
  onValueChange: (value: string|number) => void,
  onReloadValue: () => void,
}
export const ElytraField: FC<Props> = (props) => {
    const { field, value, onValueChange, onReloadValue } = props;

    if (field.flags.readonly) {
        return <ReadOnlyField field={field} value={value} onReloadValue={onReloadValue} />
    }

    if (field.valueType === ValueTypes.Integer && field.min != field.max) {
        return <RangeField {...props} />
    }


    if (field.valueType === ValueTypes.Toggle) {
        return <ToggleField {...props} />
    }
    
    if (field.flags.hasOptions) {
        return <>
        {field.options.some(e => !!e) ? 
        <OptionElytraField field={field} value={value} onValueChange={onValueChange} />
        : <></>}</>
    }

  return <>
    <Field.Root>
        <Field.Label>{field.name}:</Field.Label>
        <Input value={value} type={fieldInputType(field)} onChange={e => onValueChange((e.target as HTMLInputElement).value)} />
        {field.help ? <Field.HelperText>{field.help}</Field.HelperText> : <></>}
    </Field.Root>
  </>
}

export const ToggleField: FC<Props> = (props) => {
    const { field, value, onValueChange } = props;

  return <Field.Root>
            <Field.Label>
          {field.name}:
        </Field.Label>
        <Switch.Root colorPalette="brand" checked={value === 1} onChange={e => onValueChange((e.target as HTMLInputElement).checked ? 1 : 0)}>
      <Switch.HiddenInput />
      <Switch.Control />
      <Switch.Label>{value === 1 ? "Enabled" : "Disabled"}</Switch.Label>
    </Switch.Root>
    {field.help ? <Field.HelperText>{field.help}</Field.HelperText> : <></>}
  </Field.Root>
}

export const RangeField: FC<Props> = (props) => {
    const { field, value, onValueChange } = props;

  return <Field.Root>
        <Slider.Root width={"full"} max={field.max} min={field.min} value={[value as number]} 
            onValueChange={d => onValueChange(d.value[0])}>
            <HStack justify="space-between">
                <Slider.Label>{field.name}</Slider.Label>
                <Slider.ValueText />
            </HStack>
            <Slider.Control>
                <Slider.Marks marks={[0]} />
                <Slider.Track>
                <Slider.Range />
                </Slider.Track>
                <Slider.Thumbs />
            </Slider.Control>
        </Slider.Root>
        {field.help ? <Field.HelperText>{field.help}</Field.HelperText> : <></>}
    </Field.Root>
}

export const ReadOnlyField: FC<Omit<Props, 'onValueChange' >> = ({field, value, onReloadValue}) => {
    return <Field.Root>
        <Field.Label>
          {field.name}:
        </Field.Label>
        <Group attached w="full">
            {field.icon ? (
                <InputGroup startElement={<DynamicIcon size={18} name={field.icon as IconName} />}>
                    <Input readOnly variant="subtle" value={value} />
                </InputGroup>
            ) : (
                <Input readOnly variant="subtle" value={value} />
            )}
          <IconButton size={"sm"} colorPalette="brand" onClick={() => onReloadValue()} title="Check">
            <RefreshCwIcon />
          </IconButton>
        </Group>
        {field.help ? <Field.HelperText>{field.help}</Field.HelperText> : <></>}
      </Field.Root>
}