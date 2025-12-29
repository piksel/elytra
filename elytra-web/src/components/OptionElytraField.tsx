import { useFilter, useListCollection, Flex, Combobox, Portal } from "@chakra-ui/react";
import { FC } from "preact/compat";
import { useMemo, useEffect } from "preact/hooks";
import { Props } from "./ElytraField";
import { ValueTypes } from "../types";

export const OptionElytraField: FC<Omit<Props, "onReloadValue">> = (props) => {
  const {field, value, onValueChange} = props;

  const isIndexValue = field.valueType === ValueTypes.Option;
    const initialItems = useMemo(() =>  field.options.map((label, index) => ({
        label, 
        value: isIndexValue ? index.toString() : label
      })), [field.options])

    useEffect(() => {
      console.log('InitialItems: %o', initialItems);
    }, [initialItems]);

  const { contains } = useFilter({ sensitivity: "base" })

  const { collection, filter } = useListCollection({
    initialItems,
    filter: contains,
  })

  return (
    <Flex direction={"row"} w={"100%"} className={"dark"}>
   
<Combobox.Root
      collection={collection}
      onInputValueChange={(e) => filter(e.inputValue)}
      value={value ? [value.toString()] : []}
      onValueChange={e => e.value.length && onValueChange(e.value[0])}
    >
      <Combobox.Label>{field.name}</Combobox.Label>
      <Combobox.Control>
        <Combobox.Input placeholder="Type to search" />
        <Combobox.IndicatorGroup>
          <Combobox.ClearTrigger />
          <Combobox.Trigger />
        </Combobox.IndicatorGroup>
      </Combobox.Control>
      <Portal>
        <Combobox.Positioner>
          <Combobox.Content>
            <Combobox.Empty>No timzones matches the search query</Combobox.Empty>
            {collection.items.map((item) => (
              <Combobox.Item item={item} key={item.value}>
                {item.label}
                <Combobox.ItemIndicator />
              </Combobox.Item>
            ))}
          </Combobox.Content>
        </Combobox.Positioner>
      </Portal>
    </Combobox.Root>
      </Flex>
  )
}