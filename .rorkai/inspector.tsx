
/*
The code here will is moved to our infrastructure (with ctrl+c ctrl+v)
 where we add it in _layout.tsx as it is.

It will be added at .rork/BundleInspector.tsx (web vestoin too).

That is why:
1. This file should never import other files
2. This file should never import other modules that will not be on the device.
We import react-native-safe-area-context and lucide-react-native 
but we are confident it will be there. Still not great.

*/

import {
  EventSubscription,
  requireOptionalNativeModule,
} from "expo-modules-core";
import { X } from "lucide-react-native";
import type { PropsWithChildren } from "react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import type { ViewStyle } from "react-native";
import {
  Dimensions,
  LogBox,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
// @ts-ignore
import DebuggingOverlay from "react-native/Libraries/Debugging/DebuggingOverlay.js";
// @ts-ignore
import useSubscribeToDebuggingOverlayRegistry from "react-native/Libraries/Debugging/useSubscribeToDebuggingOverlayRegistry";
import type {
  InspectorData,
  TouchedViewDataAtPoint,
  // @ts-ignore
} from "react-native/Libraries/Renderer/shims/ReactNativeTypes";
import ErrorUtils from "react-native/Libraries/vendor/core/ErrorUtils";
import { NativeModules } from "react-native";

const getInspectorDataForViewAtPoint =
  require("react-native/src/private/inspector/getInspectorDataForViewAtPoint").default;
const InspectorOverlay =
  require("react-native/src/private/inspector/InspectorOverlay").default;
// Removed InspectorPanel import - implementing inline

type PanelPosition = "top" | "bottom";

export type InspectedElementFrame = TouchedViewDataAtPoint["frame"];

export type InspectedElement = Readonly<{
  frame: InspectedElementFrame;
  style?: ViewStyle;
}>;

export type ElementsHierarchy = InspectorData["hierarchy"];

export type BundleInspectorRef = { enableDebuggingOverlay: () => void };
export type BundleInspectorProps = PropsWithChildren<{}>;

const BridgeModule = requireOptionalNativeModule("Bridge");

export function isRorkSandbox() {
  return !!NativeModules.RorkSandbox;
}

if (BridgeModule) {
  LogBox.uninstall();

  // @ts-ignore
  ErrorUtils.setGlobalHandler((error) => {
    sendBridgeMessage("runtime-error", {
      stack: error.stack,
      message: error.message,
    });
  });
}

export function sendBridgeMessage(
  type:
    | "inspector-element"
    | "merge-inspector-state"
    | "runtime-ready"
    | "runtime-error",
  data?: Record<string, any>,
) {
  if (data) {
    return BridgeModule?.sendMessage({ type, data: JSON.stringify(data) });
  }

  return BridgeModule?.sendMessage({ type });
}

export function addBridgeListener(
  listener: (data: Record<string, any>) => void,
): EventSubscription {
  return BridgeModule?.addListener("onMessage", (data: any) => {
    if (typeof data !== "object") return;
    if (data.data) {
      listener({ ...data, data: JSON.parse(data.data) });
    } else {
      listener(data);
    }
  });
}

export function useBridge() {
  const [state, setState] = useState({ inspectorEnabled: false });

  useEffect(() => {
    const subscription = addBridgeListener((data) => {
      if (typeof data === "object" && data.type === "merge-inspector-state") {
        setState((prev) => ({ ...prev, ...data.data }));
      }
    });

    sendBridgeMessage("runtime-ready");

    return () => subscription?.remove();
  }, []);

  const disableInspector = useCallback(() => {
    setState((prev) => ({ ...prev, inspectorEnabled: false }));
    sendBridgeMessage("merge-inspector-state", { inspectorEnabled: false });
  }, []);

  return { ...state, disableInspector };
}

export function BundleInspector(props: BundleInspectorProps) {
  const innerViewRef = useRef(null);
  const appContainerRootViewRef = useRef(null);
  const debuggingOverlayRef = useRef(null);
  const { inspectorEnabled, disableInspector } = useBridge();

  const [panelPosition, setPanelPosition] = useState<PanelPosition>("bottom");
  const [inspectedElement, setInspectedElement] =
    useState<InspectedElement | null>(null);

  const [lastPayload, setLastPayload] = useState<Record<string, any> | null>(
    null,
  );

  useEffect(() => {
    if (inspectorEnabled) return;
    setInspectedElement(null);
    setPanelPosition("bottom");
  }, [inspectorEnabled]);

  useSubscribeToDebuggingOverlayRegistry(
    appContainerRootViewRef,
    debuggingOverlayRef,
  );

  const handleInspectedElementChange = useCallback(
    (viewData: TouchedViewDataAtPoint | null) => {
      if (viewData) {
        const payload = {
          style: viewData.props.style,
          frame: viewData.frame,
          componentStack: viewData.componentStack,
          hierarchy: viewData.hierarchy?.map((h: any) => ({
            name: h.name ?? null,
          })),
        };

        setLastPayload(payload);
      }
    },
    [],
  );

  const onTouchPoint = (locationX: number, locationY: number) => {
    getInspectorDataForViewAtPoint(
      innerViewRef.current,
      locationX,
      locationY,
      (viewData: TouchedViewDataAtPoint) => {
        setPanelPosition(
          viewData.pointerY > Dimensions.get("window").height * 0.8
            ? "top"
            : "bottom",
        );

        setInspectedElement({
          frame: viewData.frame,
          style: viewData.props.style,
        });

        handleInspectedElementChange(viewData);

        return false;
      },
    );
  };

  const { top, bottom } = useSafeAreaInsets();

  const panelContainerStyle =
    panelPosition === "bottom"
      ? { bottom: 0, marginBottom: bottom }
      : { top: 0, marginTop: top };

  return (
    <View style={styles.container} ref={appContainerRootViewRef}>
      <View style={styles.container} ref={innerViewRef}>
        {props.children}
      </View>

      {inspectorEnabled && (
        <DebuggingOverlay ref={debuggingOverlayRef} style={styles.absolute} />
      )}

      {inspectorEnabled && (
        <View style={styles.inspectorContainer} pointerEvents="box-none">
          <InspectorOverlay
            inspected={inspectedElement}
            onTouchPoint={onTouchPoint}
          />

          <OptionalBlurView
            style={[
              {
                position: "absolute",
                left: 0,
                right: 0,
                backgroundColor: "rgba(0, 0, 0, 0.85)",
                borderRadius: 30,
                marginHorizontal: 12,
                padding: 12,
                paddingLeft: 20,
                overflow: "hidden",
              },
              panelContainerStyle,
            ]}
          >
            {inspectedElement ? (
              <View style={styles.floatingIsland}>
                <Text style={styles.islandText}>Element selected</Text>
                <View style={styles.buttonGroup}>
                  <TouchableOpacity
                    style={styles.selectButton}
                    onPress={() => {
                      if (lastPayload) {
                        sendBridgeMessage("inspector-element", lastPayload);
                        disableInspector();
                      }
                    }}
                  >
                    <Text style={styles.buttonText}>Select</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.72}
                    style={styles.cancelButton}
                    onPress={disableInspector}
                  >
                    <X size={18} color="#808080" strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.floatingIsland}>
                <Text style={styles.islandText}>
                  Touch any element to inspect
                </Text>
                <TouchableOpacity
                  activeOpacity={0.72}
                  style={styles.cancelTextButton}
                  onPress={disableInspector}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </OptionalBlurView>
        </View>
      )}
    </View>
  );
}

const OptionalBlurView = ({
  style,
  children,
}: {
  style: ViewStyle | ViewStyle[];
  children: React.ReactNode;
}) => {
  const [BlurComponent, setBlurComponent] = useState<any>(null);

  React.useEffect(() => {
    const loadBlurComponent = async () => {
      try {
        const { BlurView } = await import("expo-blur");
        setBlurComponent(() => BlurView);
      } catch (error) {
        console.log("Blur library not available");
      }
    };

    loadBlurComponent();
  }, []);

  if (BlurComponent) {
    return (
      <BlurComponent style={style} tint="light" intensity={10}>
        {children}
      </BlurComponent>
    );
  }

  // Fallback view
  return <View style={style}>{children}</View>;
};

function ElementEditor() {
  // Element editor state
  const [editMargin, setEditMargin] = useState("0");
  const [editPadding, setEditPadding] = useState("0");
  const [editColor, setEditColor] = useState("#000000");
  const [editBgColor, setEditBgColor] = useState("#ffffff");
  const [editBorderWidth, setEditBorderWidth] = useState("0");
  const [editBorderRadius, setEditBorderRadius] = useState("0");
  const [editOpacity, setEditOpacity] = useState("1");

  return (
    <View style={styles.elementInfo}>
      <View style={styles.editorSection}>
        <Text style={styles.sectionTitle}>Spacing</Text>
        <View style={styles.inputGrid}>
          <View style={styles.inputCell}>
            <Text style={styles.inputLabel}>Margin</Text>
            <TextInput
              style={styles.compactInput}
              value={editMargin}
              onChangeText={setEditMargin}
              placeholder="0"
              placeholderTextColor="#666"
            />
          </View>
          <View style={styles.inputCell}>
            <Text style={styles.inputLabel}>Padding</Text>
            <TextInput
              style={styles.compactInput}
              value={editPadding}
              onChangeText={setEditPadding}
              placeholder="0"
              placeholderTextColor="#666"
            />
          </View>
        </View>
      </View>

      <View style={styles.editorSection}>
        <Text style={styles.sectionTitle}>Style</Text>
        <View style={styles.inputGrid}>
          <View style={styles.inputCell}>
            <Text style={styles.inputLabel}>Color</Text>
            <TextInput
              style={styles.compactInput}
              value={editColor}
              onChangeText={setEditColor}
              placeholder="#000"
              placeholderTextColor="#666"
            />
          </View>
          <View style={styles.inputCell}>
            <Text style={styles.inputLabel}>BG</Text>
            <TextInput
              style={styles.compactInput}
              value={editBgColor}
              onChangeText={setEditBgColor}
              placeholder="#fff"
              placeholderTextColor="#666"
            />
          </View>
          <View style={styles.inputCell}>
            <Text style={styles.inputLabel}>Opacity</Text>
            <TextInput
              style={styles.compactInput}
              value={editOpacity}
              onChangeText={setEditOpacity}
              placeholder="1"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />
          </View>
        </View>
      </View>

      <View style={styles.editorSection}>
        <Text style={styles.sectionTitle}>Border</Text>
        <View style={styles.inputGrid}>
          <View style={styles.inputCell}>
            <Text style={styles.inputLabel}>Width</Text>
            <TextInput
              style={styles.compactInput}
              value={editBorderWidth}
              onChangeText={setEditBorderWidth}
              placeholder="0"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />
          </View>
          <View style={styles.inputCell}>
            <Text style={styles.inputLabel}>Radius</Text>
            <TextInput
              style={styles.compactInput}
              value={editBorderRadius}
              onChangeText={setEditBorderRadius}
              placeholder="0"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.applyButton}>
        <Text style={styles.applyButtonText}>Apply</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  absolute: StyleSheet.absoluteFillObject,
  inspectorContainer: {
    position: "absolute",
    backgroundColor: "transparent",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  properties: {
    flexShrink: 1,
  },
  elementInfo: {
    padding: 8,
    gap: 3,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    color: "white",
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
    opacity: 0.7,
  },
  boxModel: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 10,
    borderRadius: 4,
    alignItems: "center",
  },
  boxText: {
    color: "white",
    fontSize: 13,
    fontWeight: "500",
  },
  layoutInfo: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 8,
    borderRadius: 4,
  },
  layoutText: {
    color: "white",
    fontSize: 12,
    marginBottom: 2,
  },
  styleInfo: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 8,
    borderRadius: 4,
  },
  styleText: {
    color: "white",
    fontSize: 11,
    marginBottom: 2,
    fontFamily: "monospace",
  },
  waiting: {
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  waitingContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  waitingText: {
    fontSize: 14,
    textAlign: "center",
    color: "white",
    opacity: 0.9,
    fontWeight: "500",
  },
  waitingSubText: {
    fontSize: 12,
    textAlign: "center",
    color: "white",
    opacity: 0.6,
    marginTop: 4,
  },
  floatingIsland: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  },
  islandText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  buttonGroup: {
    flexDirection: "row",
    gap: 8,
  },
  selectButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 60,
  },
  cancelButton: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 16,
    aspectRatio: 1,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelTextButton: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 60,
  },
  buttonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  panelTitle: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  editorSection: {
    marginBottom: 10,
  },
  inputGrid: {
    flexDirection: "row",
    gap: 8,
  },
  inputCell: {
    flex: 1,
  },
  inputLabel: {
    color: "white",
    fontSize: 10,
    fontWeight: "500",
    marginBottom: 2,
    opacity: 0.8,
  },
  compactInput: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    color: "white",
    fontSize: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    height: 28,
  },
  applyButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 8,
    alignSelf: "flex-end",
  },
  applyButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});

