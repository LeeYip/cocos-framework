/**
 * 事件名
 */
export enum EventName {
	/** cc.view 调整视窗尺寸的事件，仅在 Web 平台下有效 */
	RESIZE,
	/** 更新多语言组件 */
	UPDATE_LOCALIZED_CMPT,

	/** 游戏暂停 */
	GAME_PAUSE,
	/** 游戏恢复 */
	GAME_RESUME,
	/** 游戏时间缩放值修改 */
	TIME_SCALE,

	/** 相机移动 */
	CAMERA_MOVE,

	EVENT_TEST1,
	EVENT_TEST2,
};
