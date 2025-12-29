/// <reference types="@types/w3c-web-usb" />
import { FC, useState, useEffect } from 'react'

import { Box, Button, Card, CardBody, CardHeader, Flex, Heading, Spinner, Alert, AlertDescription, AlertTitle, Group, Textarea, CardDescription, Show, HStack, IconButton, Menu, Portal, VStack, Text, Stack, DataList, Link } from "@chakra-ui/react";
import { SaveIcon, UsbIcon, UnplugIcon, BugIcon, WashingMachineIcon, UploadCloudIcon, ChevronDownIcon } from "lucide-react";
import { DynamicIcon, IconName } from 'lucide-react/dynamic';
import { FieldDesc, EntryTypes, ElytraConfig, DeviceInfo } from './types';
import { cloudWasmFileDevice, Elytra, ElytraUSBDevice, localWasmFileDevice } from './elytra';
import { ElytraField } from './components'

type Status = 'Disconnected' | 'Connecting' | 'Connected';
type ReactElement = React.ReactElement;

const OnlyDev: FC<React.PropsWithChildren<{}>> = ({children}) => import.meta.env.DEV ? <>{children}</> : <></>


export const App = () => {
  const [elytra, setElytra] = useState<Elytra>();
  const [status, setStatus] = useState<Status>('Disconnected');
  const [usbError, setUsbError] = useState<string>();
  const [fieldValues, setFieldValues] = useState<Record<string, string | number>>({});
  const [currValues, setCurrValues] = useState<Record<string, string | number>>({});
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>();

  const [config, setConfig] = useState<ElytraConfig>()

  useEffect(() => {
    setStatus(elytra ? 'Connected' : 'Disconnected');
  }, [elytra]);

  useEffect(() => {
    if (!elytra || !config) return;

    const resourceBaseUrl = `/devices/${config.deviceInfo.manufacturer.toLowerCase().replaceAll(' ', '_')}/${config.deviceInfo.name}`;

    const {name, manufacturer} = config.deviceInfo;
    (async () => {
      let json = undefined;
      try {
      const res = await fetch(`${resourceBaseUrl}/device.json`);
      json = await res.json();
      } catch (e) {
        console.warn("Failed to fetch device info:", e);
      }
      setDeviceInfo({ name, manufacturer, json, resourceBaseUrl });
    })()

    elytra.getFieldValues(config).then(fv => {
      setFieldValues(fv);
      setCurrValues(fv);
  });
  }, [elytra, config]);

  const doConnect = async (deviceStr: string) => {
    setStatus('Connecting');
    setUsbError(undefined);
    try {
      const device = deviceStr === 'usb' ? new ElytraUSBDevice() 
        : deviceStr === "upload" ? await localWasmFileDevice() 
        : await cloudWasmFileDevice(deviceStr);
      await device.init();
      const proto = new Elytra(device);

      const config = await proto.init();
      setConfig(config);
      setElytra(proto);

    } catch (error) {
      console.dir({ error });
      console.error('WebUSB error %o', error);
      setUsbError(`${error}`);
      setStatus('Disconnected');
    }
  }

  const doDisconnect = async () => {
    if (elytra) {
      await elytra.device.disconnect();
      setElytra(undefined);
    }
    setConfig(undefined);
    setFieldValues({});
    setStatus('Disconnected')
  }

  const reloadValue = async (field: FieldDesc) => {
    const entry = field.valueKey.startsWith(EntryTypes.Info) ? EntryTypes.Info : EntryTypes.Prop;
    const fieldIndex = Number(field.valueKey.substring(1));
    const newValue = await elytra.queryFieldValue(field, entry, fieldIndex);
    setFieldValues(cv => ({...cv, [field.valueKey]: newValue }))
  }

  const doSaveSection = async (sectionIndex: number) => {
    if (!elytra) return;
    console.log("Saving section %o", sectionIndex);

    const writableFields = config.sections[sectionIndex].fields.filter(field => !field.flags.readonly);

    for (const field of writableFields) {
      const entry = field.entryType;
      if (entry !== EntryTypes.Info && entry !== EntryTypes.Prop) continue;
      const value = fieldValues[field.valueKey];
      if (!value || value === currValues[field.valueKey]) continue;

      await elytra.writeField(field, entry, field.entryIndex, value);
      setCurrValues(c => ({...c, [field.valueKey]: value}))
    }

  }

  const sections = config?.sections || [];

  return (
    <Box width={'100%'} minW={"90vmin"} className="dark">
      <Flex direction='column' gap={5} alignItems="center">
        <HStack gap="3" alignItems="flex-end" justifyContent="center" marginTop="2.5" marginBottom="-2.5" position="relative">
          <img src="/icon.svg" style="margin:0; height: 32px; filter: grayscale(1) opacity(0.75) brightness(2.0)" />
          <Heading fontWeight="extralight" color="fg.subtle" size="3xl">elytra</Heading>
        </HStack>

        <Card.Root>
          <CardBody display='flex' flexDir='column' gap={4}>
            <ConnectStatus error={usbError} status={status} onConnect={doConnect} onDisconnect={doDisconnect} />
          </CardBody>
        </Card.Root>

        <Show when={status === "Connecting"}>
          <Box>
          <Spinner size={"xl"} colorPalette="brand" color="colorPalette.600" />
          </Box>
        </Show>

        <Show when={status === "Connected"}>
          <DeviceInfoSection {...{ status, deviceInfo }} />

        {sections.map((section, si) => (<>
            <Card.Root>
              <CardHeader>
                <Group>
                {section.icon ? <DynamicIcon name={section.icon as IconName} /> : <></>}
                <Heading size='md'>
                        
                  {section.name}
                </Heading>
                </Group>
                {section.help ? <CardDescription>{section.help}</CardDescription> : <></>}
              </CardHeader>
              <CardBody display='flex' flexDir='column' gap={4}>
                {section.fields.map(field => <>
                  <ElytraField field={field}
                    onReloadValue={() => reloadValue(field)}
                    value={fieldValues[field.valueKey]} 
                    onValueChange={(v) => setFieldValues(cv => ({ ...cv, [field.valueKey]: v }))} />
                </>)}
                {section.fields.some(field => !field.flags.readonly) ? (
                  <Button paddingX={10} colorPalette="brand" onClick={() => doSaveSection(si)}><SaveIcon /> Save</Button>
                ) : <></>}
              </CardBody>
            </Card.Root>
          </>))}

       </Show>

        <OnlyDev>
          <Card.Root>
            <Card.Header>
              <Group>
                <BugIcon size={16} />
                <Heading size='sm'>Field Values</Heading>
              </Group>
            </Card.Header>
            <Card.Body>
              <Textarea fontFamily="mono" resize="vertical" size="xs" autoresize minH="4lh" maxH="10lh" 
                value={JSON.stringify(fieldValues, null, 2)} />
            </Card.Body>
          </Card.Root>
        </OnlyDev>

                <OnlyDev>
          <Card.Root>
            <Card.Header>
              <Group>
                <BugIcon size={16} />
                <Heading size='sm'>Elytra Config</Heading>
              </Group>
            </Card.Header>
            <Card.Body>
              <Textarea fontFamily="mono" resize="vertical" size="xs" autoresize minH="4lh" maxH="10lh" 
                value={JSON.stringify(config, null, 2)} />
            </Card.Body>
          </Card.Root>
        </OnlyDev>

      </Flex>
    </Box>
  )
}

const GithubIcon: FC<{}> = () => {
  return <svg role="img" style="height: 1em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path fill="currentColor" d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
  </svg>
}


const z = (n: number) => n.toString(10).padStart(2, '0');

const ConnectStatus: FC<{
  status: Status, error?: string,
  onConnect: (device: "usb" | "upload" | string) => void, onDisconnect: () => void

}> = (props) => {

  const { status, onConnect, onDisconnect } = props;

  return (<>
    <HStack justifyContent={"space-between"} flexWrap="wrap">
      <DataList.Root size="sm">
        <DataList.Item>
          <DataList.ItemLabel>Status</DataList.ItemLabel>
          <DataList.ItemValue>
            <Text>{status}</Text>
          </DataList.ItemValue>
        </DataList.Item>
      </DataList.Root>
      <Show when={status === 'Connected'}>
        <Button colorPalette="brand" onClick={onDisconnect}>
          <UnplugIcon />
          Disconnect
        </Button>
      </Show>
      <Show when={status === 'Connecting'}>
        <Button colorPalette="brand" disabled>
          <Spinner />
          Conecting...
        </Button>
      </Show>
      <Show when={status === 'Disconnected'}>
        <Group attached colorPalette="brand">
          <Button colorPalette="brand" onClick={() => onConnect("usb")}>
            <UsbIcon />
            Connect
          </Button>
          <Menu.Root  onSelect={d => onConnect(d.value)}>
            <Menu.Trigger asChild>
              <IconButton><ChevronDownIcon /></IconButton>
            </Menu.Trigger>
            <Portal>
              <Menu.Positioner right="{0}" left={0} top={{base: "124px!important", sm: "157px!important"}} display={"flex"} justifyContent={"center"}>
                <Menu.Content marginLeft={{ base: "auto", sm: "230px"}} marginRight={{base: '23px', sm: 'unset'}} >
                  <Menu.Item value={(new URL("clock_example.wasm", location.href).toString())}>
                    <WashingMachineIcon />
                    Open Dummy Example
                  </Menu.Item>
                  <Menu.Item value="upload">
                    <UploadCloudIcon />
                    Upload WASM Dummy file
                  </Menu.Item>
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>
        </Group>
      </Show>
      
    </HStack>
    <Show when={props.error}>
      <Alert.Root status='error' alignItems='top'>
        <Alert.Indicator />
        <VStack alignItems="flex-start">
          <AlertTitle display='block'>Failed to connect!</AlertTitle>
          <AlertDescription>{props.error}</AlertDescription>
        </VStack>
      </Alert.Root>
    </Show>
    

  </>
  )
}

const PrettyLink: FC<{href: string}> = ({href}) => {

  const [icon, text] = 
    href.startsWith('https://github.com/') ? [<GithubIcon />, href.substring(19)] : [<></>, href];

  return <Link href={href} color={"white"}>
            {icon}
            {text}</Link>
}

const DeviceInfoSection: FC<{deviceInfo: DeviceInfo, status: Status}> = ({deviceInfo, status}) => {

  if (!deviceInfo || status !== 'Connected') return <></>

  const {name, manufacturer, json } = deviceInfo; 
  const urls = deviceInfo?.json?.urls ?? {};

  return <Card.Root>
          <CardBody display='flex' flexDir='column' gap={4}>
            <Stack direction={{ base: 'column', sm: 'row'}}  gap={5} alignItems={{ base: 'center', sm: "flex-start"}}>
              <Box margin={{ base: '0 auto', sm: '0'}} >
                { urls.image ?
                
                <img src={urls.image} style="width: 200px; max-width: 40vw; margin-bottom: 0"/ >
                : <WashingMachineIcon size="200" stroke="#444" style="width: 200px; max-width: 40vw;" /> }
                
              </Box>
       
        <VStack width="100%" gap={0}>
        <VStack gap={0} alignItems={{ base: 'center', sm: "flex-start"}} width={"100%"}>
          <Heading size={"xl"} textWrap={'auto'}>{name}</Heading>
          <Text mb="3" fontSize="md" color="fg.muted">{manufacturer}</Text>
          </VStack>

        <Show when={json}>
      <DataList.Root size="md" alignSelf={"flex-start"}>
        <Show when={urls.documentation}>
        <DataList.Item>
          <DataList.ItemLabel>Documentation</DataList.ItemLabel>
          <DataList.ItemValue>
            <PrettyLink href={urls.documentation} />
          </DataList.ItemValue>
        </DataList.Item>
        </Show>
        <Show when={urls.firmware}>
        <DataList.Item>
          <DataList.ItemLabel>Firmware updates</DataList.ItemLabel>
          <DataList.ItemValue>
            <PrettyLink href={urls.firmware} />
          </DataList.ItemValue>
        </DataList.Item>
        </Show>
      </DataList.Root>
        </Show>

        </VStack>
       </Stack>
       <Show when={json}>
             <DataList.Root size="md">
        <DataList.Item>
          <DataList.ItemLabel>Description</DataList.ItemLabel>
          <DataList.ItemValue>
       <Text>{json?.description}</Text>
          </DataList.ItemValue>

        </DataList.Item>
        </DataList.Root>
        </Show>

              </CardBody>
        </Card.Root>

}