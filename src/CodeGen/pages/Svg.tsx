import {
	Button,
	Columns,
	Container,
	Muted,
	Text,
	VerticalSpace,
	IconPlus32,
	IconTarget16,
	SelectableItem,
	Textbox,
	TextboxMultiline,
	Layer,
	Disclosure,
	FileUploadDropzone,
	Checkbox,
} from "@create-figma-plugin/ui";
import { emit, on } from "@create-figma-plugin/utilities";
import { h } from "preact";
import { useCallback, useState, useEffect, useReducer } from "preact/hooks";
import { EventHandler } from "@create-figma-plugin/ui";
import styles from "./svg.module.css";

import JSZip from "jszip";
import { saveAs } from "file-saver";

import {
	CloseHandler,
	SvgSymbolHandler,
	MessageHandler,
	ScanHandler,
	SectionSelectUiRequestHandler,
	FigmaSelectMainResponseHandler,
	SelectList,
	SelectNodeByIdZoomHandler,
	SectionSelectSvgUiRequestHandler,
	SectionSelectSvgMainResponseHandler,
	GenerateSvgFromLazyNodesUiRequestHandler,
	GenerateSvgFromLazyNodesMainResponseHandler,
	GetNodeInfoUiRequestHandler,
	GetNodeInfoMainResponseHandler,
	Project,
	ProjectUIHandler,
	ProjectMainHandler,
	LazyNodeData,
} from "../types";
import {
	addArrayFilterCurry,
	addValueFilterCurry,
	handleFileInput,
	JsonToObject,
} from "../../utils/jsonFile";
import DragLayer from "../../components/DragLayer";
import { LLog } from "../../utils/console";
import { FilterType, pathNodeType } from "../../FigmaPluginUtils";
import { svgExporter } from "../../utils/svgComposer";
import { SVGResult } from "../domain/entities/NodeInfo";
import FolderableCode from "../../components/FolderableCode";
import DuplicateCheck from "../../components/DuplicateCheck";

/**
 *
 * @param text
 * @param fileName .json 확장자 생략가능
 */

const addUniqueSection = addValueFilterCurry<SelectList>(
	(item, index, array) => {
		return (
			index === array.findIndex((t) => t.id === item.id && t.name === item.name)
		);
	},
);

const addUniqueArraySection = addArrayFilterCurry<SelectList>(
	(item, index, array) => {
		return (
			index === array.findIndex((t) => t.id === item.id && t.name === item.name)
		);
	},
);

//event: h.JSX.TargetedMouseEvent<HTMLInputElement>

function Plugin() {
	const [sections, setSections] = useState<SelectList[]>([]);
	const [filter, setFilter] = useState<FilterType>({
		DOCUMENT: true,
		PAGE: true,
		SECTION: true,
		COMPONENT_SET: true,
		COMPONENT: true,
	});
	const [project, setProject] = useState<Project>({
		fileKey: "",
		projectName: "",
	});
	const [path, setPath] = useState<`/${string}`>();
	const [selectOpen, setSelectOpen] = useState<boolean>(false);
	const [filterOpen, setFilterOpen] = useState<boolean>(false);
	const [lazyNodes, setLazyNodes] = useState<LazyNodeData[]>([]); // 실제 SVG 대신 lazyNodes 저장
	const [lazyNodesOpen, setLazyNodesOpen] = useState<boolean>(false);
	const [nodeInfoOpen, setNodeInfoOpen] = useState<boolean>(false);
	const [selectedNodeInfo, setSelectedNodeInfo] = useState<{
		id: string;
		name: string;
		type: string;
		width: number;
		height: number;
		properties: Record<string, any>;
	} | null>(null);

	const generateTrigger = () => {
		emit<SectionSelectSvgUiRequestHandler>(
			"SECTION_SELECT_SVG_UI_GENERATE_REQUEST",
			sections,
			filter,
		);
	};

	const generateSvgFromLazyNodes = () => {
		if (lazyNodes && lazyNodes.length > 0) {
			emit<GenerateSvgFromLazyNodesUiRequestHandler>(
				"GENERATE_SVG_FROM_LAZY_NODES_UI_REQUEST",
				lazyNodes,
				filter,
			);
		}
	};

	const getNodeInfo = (nodeId: string, pageId: string) => {
		emit<GetNodeInfoUiRequestHandler>(
			"GET_NODE_INFO_UI_REQUEST",
			nodeId,
			pageId,
		);
	};

	useEffect(() => {
		emit<ProjectUIHandler>("PROJECT_INFO_UI_RESPONSE");

		on<SectionSelectSvgMainResponseHandler>(
			"SECTION_SELECT_SVG_MAIN_GENERATE_RESPONSE",
			(result) => {
				setLazyNodes(result);
			},
		);

		on<GenerateSvgFromLazyNodesMainResponseHandler>(
			"GENERATE_SVG_FROM_LAZY_NODES_MAIN_RESPONSE",
			(svgResult) => {
				// SVG 결과를 받아서 export 처리
				const exportOptions = {
					sections,
					filter,
					project,
					...(path && { path }),
				};
				svgExporter(lazyNodes, exportOptions, svgResult);
			},
		);

		on<FigmaSelectMainResponseHandler>("SECTION_SELECT_UI_RESPONSE", (data) => {
			setSections((array) => addUniqueSection(array, data));
		});

		on<ProjectMainHandler>("PROJECT_INFO_MAIN_RESPONSE", (data) => {
			setProject(data);
		});

		on<GetNodeInfoMainResponseHandler>(
			"GET_NODE_INFO_MAIN_RESPONSE",
			(data) => {
				setSelectedNodeInfo(data);
			},
		);
	}, []);

	// sections가 변경될 때마다 lazyNodes 업데이트
	useEffect(() => {
		if (sections.length > 0) {
			emit<SectionSelectSvgUiRequestHandler>(
				"SECTION_SELECT_SVG_UI_GENERATE_REQUEST",
				sections,
				filter,
			);
		} else {
			setLazyNodes([]);
		}
	}, [sections, filter]);

	const deleteSection = (id: string) => {
		const newArray = sections.filter((selectList) => {
			return !(selectList.id === id);
		});
		setSections(newArray);
	};

	const filterActionCurry = (keyName: keyof FilterType) => {
		return {
			value: filter[keyName],
			onChange: (e: h.JSX.TargetedEvent<HTMLInputElement, Event>) => {
				const value = e.currentTarget.checked;
				setFilter((data) => {
					return { ...data, [keyName]: value };
				});
			},
		};
	};

	return (
		<Container space="medium">
			<VerticalSpace space="extraLarge" />
			<Text>{project.projectName}</Text>
			<VerticalSpace space="small" />
			<Textbox
				value={path || ""}
				placeholder="경로 입력 (ex: /v2)"
				onChange={(e) => {
					let value = e.currentTarget.value;

					if (value.length > 0 && !value.startsWith("/")) {
						value = "/" + value;
					}

					setPath(value as `/${string}`);
				}}
			></Textbox>
			<VerticalSpace space="medium" />
			<Text>section select</Text>
			<VerticalSpace space="medium" />

			<Textbox
				icon={<IconPlus32></IconPlus32>}
				value={"섹션 추가"}
				readOnly
				onClick={(e) => {
					emit<SectionSelectUiRequestHandler>("SECTION_SELECT_UI_REQUEST");
				}}
			></Textbox>

			<Disclosure
				onClick={(event) => {
					setSelectOpen(!(selectOpen === true));
				}}
				open={selectOpen}
				title={`Select List (${sections.length} items)`}
			>
				<Container space="extraSmall" className={styles.extra}>
					{sections.length === 0 ? (
						<Text>
							<Muted>
								선택된 노드가 없습니다. "섹션 추가" 버튼을 클릭하여 노드를
								선택하세요.
							</Muted>
						</Text>
					) : (
						sections.map(({ id, name, pageName, pageId }) => {
							return (
								<DragLayer
									right={() => {
										deleteSection(id);
									}}
									left={() => {
										deleteSection(id);
									}}
									limit={80}
									key={id}
									description={`${pageName} • ID: ${id}`}
									icon={<IconTarget16 />}
									onClick={(e) => {
										e.preventDefault();
										emit<SelectNodeByIdZoomHandler>(
											"SELECT_NODE_BY_ID_ZOOM",
											id,
											pageId,
										);
									}}
								>
									{name}
								</DragLayer>
							);
						})
					)}
				</Container>
			</Disclosure>

			{lazyNodes.length > 0 && (
				<div>
					<VerticalSpace space="small" />
					<Text>
						<Muted>지연처리 대기중입니다 ~</Muted>
					</Text>
					<VerticalSpace space="small" />
					<Disclosure
						onClick={(event) => {
							setLazyNodesOpen(!(lazyNodesOpen === true));
						}}
						open={lazyNodesOpen}
						title={`Lazy Nodes (${lazyNodes.length} items)`}
					>
						<Container space="extraSmall" className={styles.extra}>
							{lazyNodes.map((lazyNode, index) => {
								// sections에서 해당 노드 정보 찾기
								const section = sections.find((s) => s.id === lazyNode.nodeId);
								return (
									<DragLayer
										right={() => {
											// 실제 위치로 이동
											if (section) {
												emit<SelectNodeByIdZoomHandler>(
													"SELECT_NODE_BY_ID_ZOOM",
													section.id,
													section.pageId,
												);
											}
										}}
										left={() => {
											// 중복 감지 및 삭제
											const duplicateIndex = lazyNodes.findIndex(
												(node, i) =>
													i !== index && node.nodeId === lazyNode.nodeId,
											);
											if (duplicateIndex !== -1) {
												const newLazyNodes = lazyNodes.filter(
													(_, i) => i !== duplicateIndex,
												);
												setLazyNodes(newLazyNodes);
											}
										}}
										limit={80}
										key={`${lazyNode.nodeId}-${index}`}
										description={`${section?.pageName || "Unknown"} • ID: ${lazyNode.nodeId}`}
										icon={<IconTarget16 />}
										onClick={(e) => {
											e.preventDefault();
											// 이름 변경 기능 (실제로는 노드 정보 표시)
											if (section) {
												getNodeInfo(section.id, section.pageId);
											}
										}}
									>
										{section?.name || `Node ${lazyNode.nodeId}`}
									</DragLayer>
								);
							})}
						</Container>
					</Disclosure>
				</div>
			)}

			<Columns space="extraSmall">
				{/* <Button
          fullWidth
          onClick={() => {
            // export json
            saveAs(
              new Blob([JSON.stringify(sections)], {
                type: "application/json",
              }),
              "export.json"
            );
          }}
          secondary
        >
          Export JSON
        </Button> */}
				<Button
					fullWidth
					onClick={() => {
						if (lazyNodes && lazyNodes.length > 0) {
							generateSvgFromLazyNodes();
						}
					}}
				>
					Export SVG
				</Button>
			</Columns>

			<VerticalSpace space="extraSmall"></VerticalSpace>
			<Disclosure
				onClick={(event) => {
					setFilterOpen(!(filterOpen === true));
				}}
				open={filterOpen}
				title="Naming Option"
			>
				<div className={styles.svgNameWrap}>
					{pathNodeType
						.filter((t) => t !== "COMPONENT")
						.map((key, index) => {
							return (
								<div key={key} className={styles.svgNameFilter}>
									<Checkbox {...filterActionCurry(key)}>
										<Text>
											{index + 1}. {key}
										</Text>
									</Checkbox>
								</div>
							);
						})}{" "}
				</div>
			</Disclosure>

			<Disclosure
				onClick={(event) => {
					setNodeInfoOpen(!(nodeInfoOpen === true));
				}}
				open={nodeInfoOpen}
				title="Node Information"
			>
				<Container space="extraSmall">
					{sections.length > 0 ? (
						<div>
							<Text>
								<Muted>
									선택된 노드 중 하나를 클릭하여 상세 정보를 확인하세요
								</Muted>
							</Text>
							<VerticalSpace space="small" />
							{sections.map(({ id, name, pageName, pageId }) => (
								<Button
									key={id}
									fullWidth
									secondary
									onClick={() => getNodeInfo(id, pageId)}
								>
									{name} ({pageName})
								</Button>
							))}
							{selectedNodeInfo && (
								<div>
									<VerticalSpace space="small" />
									<Disclosure open={true} title="Selected Node Details">
										<Container space="extraSmall">
											<Text>
												<strong>ID:</strong> {selectedNodeInfo.id}
											</Text>
											<Text>
												<strong>Name:</strong> {selectedNodeInfo.name}
											</Text>
											<Text>
												<strong>Type:</strong> {selectedNodeInfo.type}
											</Text>
											<Text>
												<strong>Size:</strong> {selectedNodeInfo.width} ×{" "}
												{selectedNodeInfo.height}
											</Text>
											{Object.keys(selectedNodeInfo.properties).length > 0 && (
												<div>
													<VerticalSpace space="small" />
													<Text>
														<strong>Properties:</strong>
													</Text>
													<TextboxMultiline
														value={JSON.stringify(
															selectedNodeInfo.properties,
															null,
															2,
														)}
														readOnly
													/>
												</div>
											)}
										</Container>
									</Disclosure>
								</div>
							)}
						</div>
					) : (
						<Text>
							<Muted>
								선택된 노드가 없습니다. "섹션 추가" 버튼을 클릭하여 노드를
								선택하세요.
							</Muted>
						</Text>
					)}
				</Container>
			</Disclosure>

			<FileUploadDropzone
				onSelectedFiles={async (e) => {
					console.log(e);
					// 중복 아이디 삭제하면서 여러 json 추가 가능
					const data = await JsonToObject(e);
					// 읽은 json 들에서 sections만 읽어서 array로 궈성

					const setting = data[0];
					// const jsonSections = data.flatMap((i) => i.sections);
					console.log("setting::", setting);
					const jsonSections = setting.sections;
					setSections((array) => addUniqueArraySection(array, jsonSections));
					const jsonFilter = setting.filter;
					setFilter(jsonFilter);

					// JSON import 후 lazyNodes 생성
					if (setting.all && Array.isArray(setting.all)) {
						const importedLazyNodes = setting.all.map((item: any) => ({
							nodeId: item.node.id,
							pageId: item.nodeInfo.pageId,
							nodeInfo: item.nodeInfo,
							filter: jsonFilter,
						}));
						setLazyNodes(importedLazyNodes);
					} else {
						// all 배열이 없으면 sections를 기반으로 lazyNodes 생성
						const sectionsForLazyNodes = setting.sections || jsonSections;
						if (sectionsForLazyNodes && sectionsForLazyNodes.length > 0) {
							// sections를 기반으로 lazyNodes 생성하는 로직
							const lazyNodesFromSections = sectionsForLazyNodes.map(
								(section: any) => ({
									nodeId: section.id,
									pageId: section.pageId,
									nodeInfo: {
										pageId: section.pageId,
										seleteNodeId: section.id,
									},
									filter: jsonFilter,
								}),
							);
							setLazyNodes(lazyNodesFromSections);
						}
					}
				}}
			>
				<Text align="center">
					<Muted>import section data json</Muted>
				</Text>
			</FileUploadDropzone>
			<VerticalSpace space="small" />

			<VerticalSpace space="small" />
			<Columns space="extraSmall">
				{/* <Button
          fullWidth
          onClick={() => {
            // export json
            saveAs(
              new Blob([JSON.stringify(sections)], {
                type: "application/json",
              }),
              "export.json"
            );
          }}
          secondary
        >
          Export JSON
        </Button> */}
				<Button
					fullWidth
					onClick={() => {
						if (lazyNodes && lazyNodes.length > 0) {
							generateSvgFromLazyNodes();
						}
					}}
				>
					Dev Export SVG
				</Button>
			</Columns>
			<VerticalSpace space="small" />
		</Container>
	);
}

export default Plugin;
