(function () {
  "use strict";

  const DAY_STORAGE_PREFIX = "study-together:day:v2:";
  const PROFILE_STORAGE_KEY = "study-together:profile:v2";
  const today = new Date();
  const todayKey = toDateKey(today);
  const dayStorageKey = `${DAY_STORAGE_PREFIX}${todayKey}`;

  const exampleTasks = [
    {
      id: "example-course",
      title: "主课程学习",
      criterion: "完成今天计划的章节，并用自己的话写 3 条要点",
      minutes: 45,
      done: false,
      example: true
    },
    {
      id: "example-practice",
      title: "编程练习",
      criterion: "提交至少一个可以独立运行的练习文件",
      minutes: 45,
      done: false,
      example: true
    },
    {
      id: "example-reading",
      title: "英语或技术阅读",
      criterion: "记录 5 个新词或写一段内容摘要",
      minutes: 30,
      done: false,
      example: true
    }
  ];

  const elements = {
    localDate: document.querySelector("#localDate"),
    learnerInput: document.querySelector("#learnerInput"),
    directionInput: document.querySelector("#directionInput"),
    targetMinutesInput: document.querySelector("#targetMinutesInput"),
    learnedInput: document.querySelector("#learnedInput"),
    problemsInput: document.querySelector("#problemsInput"),
    tomorrowInput: document.querySelector("#tomorrowInput"),
    saveIndicator: document.querySelector("#saveIndicator"),
    taskList: document.querySelector("#taskList"),
    taskCount: document.querySelector("#taskCount"),
    completionRate: document.querySelector("#completionRate"),
    completedMinutes: document.querySelector("#completedMinutes"),
    progressTrack: document.querySelector("#progressTrack"),
    progressBar: document.querySelector("#progressBar"),
    weekGrid: document.querySelector("#weekGrid"),
    streakCount: document.querySelector("#streakCount"),
    reportFilename: document.querySelector("#reportFilename"),
    suggestedPath: document.querySelector("#suggestedPath"),
    addTaskButton: document.querySelector("#addTaskButton"),
    exportButton: document.querySelector("#exportButton"),
    copyButton: document.querySelector("#copyButton"),
    clearButton: document.querySelector("#clearButton"),
    toast: document.querySelector("#toast")
  };

  let profile = loadProfile();
  let state = loadDayState();
  let saveTimer;
  let toastTimer;

  function toDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function cloneExampleTasks() {
    return exampleTasks.map((task) => ({ ...task }));
  }

  function createInitialDayState() {
    return {
      date: todayKey,
      targetMinutes: "",
      tasks: cloneExampleTasks(),
      learned: "",
      problems: "",
      tomorrow: "",
      updatedAt: null
    };
  }

  function createEmptyDayState() {
    return {
      date: todayKey,
      targetMinutes: "",
      tasks: [],
      learned: "",
      problems: "",
      tomorrow: "",
      updatedAt: new Date().toISOString()
    };
  }

  function loadProfile() {
    const fallback = { learner: "", direction: "" };
    try {
      const saved = JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY));
      return saved && typeof saved === "object" ? { ...fallback, ...saved } : fallback;
    } catch (error) {
      console.warn("无法读取学习者信息。", error);
      return fallback;
    }
  }

  function normalizeTask(task, index) {
    return {
      id: String(task.id || `restored-${index}-${Date.now()}`),
      title: String(task.title || ""),
      criterion: String(task.criterion || ""),
      minutes: normalizeMinutes(task.minutes),
      done: Boolean(task.done),
      example: Boolean(task.example)
    };
  }

  function normalizeMinutes(value) {
    if (value === "") return "";
    const number = Number(value);
    if (!Number.isFinite(number)) return "";
    return Math.min(1440, Math.max(0, Math.round(number)));
  }

  function loadDayByKey(dateKey) {
    try {
      const saved = JSON.parse(localStorage.getItem(`${DAY_STORAGE_PREFIX}${dateKey}`));
      if (!saved || !Array.isArray(saved.tasks)) return null;
      return {
        date: dateKey,
        targetMinutes: normalizeMinutes(saved.targetMinutes),
        tasks: saved.tasks.map(normalizeTask),
        learned: String(saved.learned || ""),
        problems: String(saved.problems || ""),
        tomorrow: String(saved.tomorrow || ""),
        updatedAt: saved.updatedAt || null
      };
    } catch (error) {
      console.warn(`无法读取 ${dateKey} 的本地记录。`, error);
      return null;
    }
  }

  function loadDayState() {
    return loadDayByKey(todayKey) || createInitialDayState();
  }

  function saveProfile() {
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
      markSaved();
    } catch (error) {
      handleStorageError(error);
    }
  }

  function saveDay() {
    state.updatedAt = new Date().toISOString();
    try {
      localStorage.setItem(dayStorageKey, JSON.stringify(state));
      markSaved();
      renderWeek();
    } catch (error) {
      handleStorageError(error);
    }
  }

  function handleStorageError(error) {
    console.error("本地保存失败。", error);
    elements.saveIndicator.textContent = "保存失败";
    elements.saveIndicator.classList.remove("saved");
    showToast("本地保存失败，请立即导出 Markdown 备份。");
  }

  function markSaved() {
    elements.saveIndicator.textContent = "已保存";
    elements.saveIndicator.classList.add("saved");
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => {
      elements.saveIndicator.textContent = "自动保存";
      elements.saveIndicator.classList.remove("saved");
    }, 1400);
  }

  function renderDate() {
    elements.localDate.textContent = new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long"
    }).format(today);
    elements.reportFilename.textContent = `${todayKey}.md`;
    updateSuggestedPath();
  }

  function hydrateFields() {
    elements.learnerInput.value = profile.learner;
    elements.directionInput.value = profile.direction;
    elements.targetMinutesInput.value = state.targetMinutes;
    elements.learnedInput.value = state.learned;
    elements.problemsInput.value = state.problems;
    elements.tomorrowInput.value = state.tomorrow;
  }

  function updateSuggestedPath() {
    const safeLearner =
      profile.learner
        .trim()
        .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
        .replace(/\s+/g, "-")
        .slice(0, 40) || "学习者名称";
    elements.suggestedPath.textContent = `daily/${safeLearner}/${todayKey}.md`;
  }

  function createTaskElement(task) {
    const item = document.createElement("article");
    item.className = `task-item${task.done ? " done" : ""}`;
    item.dataset.taskId = task.id;

    const checkButton = document.createElement("button");
    checkButton.className = "task-check";
    checkButton.type = "button";
    checkButton.dataset.action = "toggle";
    checkButton.setAttribute(
      "aria-label",
      `${task.done ? "取消完成" : "标记完成"}：${task.title || "未命名任务"}`
    );
    checkButton.innerHTML =
      '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="m6 12 4 4 8-9"></path></svg>';

    const content = document.createElement("div");
    content.className = "task-content";

    const titleInput = document.createElement("input");
    titleInput.className = "task-title-input";
    titleInput.dataset.field = "title";
    titleInput.type = "text";
    titleInput.maxLength = 80;
    titleInput.value = task.title;
    titleInput.placeholder = "任务名称";
    titleInput.setAttribute("aria-label", "任务名称");

    const criterionInput = document.createElement("input");
    criterionInput.className = "task-criterion-input";
    criterionInput.dataset.field = "criterion";
    criterionInput.type = "text";
    criterionInput.maxLength = 160;
    criterionInput.value = task.criterion;
    criterionInput.placeholder = "可验证的完成标准";
    criterionInput.setAttribute("aria-label", "完成标准");
    content.append(titleInput, criterionInput);

    const minutesWrap = document.createElement("label");
    minutesWrap.className = "task-minutes-wrap";
    minutesWrap.setAttribute("aria-label", "学习分钟数");
    const minutesInput = document.createElement("input");
    minutesInput.className = "task-minutes";
    minutesInput.dataset.field = "minutes";
    minutesInput.type = "number";
    minutesInput.min = "0";
    minutesInput.max = "1440";
    minutesInput.step = "5";
    minutesInput.inputMode = "numeric";
    minutesInput.value = task.minutes;
    const minutesUnit = document.createElement("span");
    minutesUnit.textContent = "min";
    minutesWrap.append(minutesInput, minutesUnit);

    const deleteButton = document.createElement("button");
    deleteButton.className = "task-delete";
    deleteButton.type = "button";
    deleteButton.dataset.action = "delete";
    deleteButton.setAttribute("aria-label", `删除任务：${task.title || "未命名任务"}`);
    deleteButton.innerHTML =
      '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 7h14M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v5m4-5v5"></path></svg>';

    item.append(checkButton, content, minutesWrap, deleteButton);
    return item;
  }

  function renderTasks(focusTaskId) {
    elements.taskList.replaceChildren();

    if (state.tasks.length === 0) {
      const empty = document.createElement("div");
      empty.className = "task-empty";
      empty.textContent = "今天还没有任务。点击“添加任务”写下第一项可验证计划。";
      elements.taskList.append(empty);
    } else {
      state.tasks.forEach((task) => elements.taskList.append(createTaskElement(task)));
    }

    renderSummary();

    if (focusTaskId) {
      const target = elements.taskList.querySelector(
        `[data-task-id="${CSS.escape(focusTaskId)}"] [data-field="title"]`
      );
      target?.focus();
    }
  }

  function renderSummary() {
    const total = state.tasks.length;
    const completedTasks = state.tasks.filter((task) => task.done);
    const completed = completedTasks.length;
    const rate = total ? Math.round((completed / total) * 100) : 0;
    const minutes = completedTasks.reduce(
      (sum, task) => sum + Number(normalizeMinutes(task.minutes) || 0),
      0
    );

    elements.taskCount.textContent = `${completed} / ${total}`;
    elements.completionRate.textContent = `${rate}%`;
    elements.completedMinutes.textContent = String(minutes);
    elements.progressBar.style.width = `${rate}%`;
    elements.progressTrack.setAttribute("aria-valuenow", String(rate));
  }

  function addTask() {
    const task = {
      id: `task-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title: "",
      criterion: "",
      minutes: "",
      done: false,
      example: false
    };
    state.tasks.push(task);
    saveDay();
    renderTasks(task.id);
    showToast("已添加一项空白任务，请填写名称和完成标准。");
  }

  function findTaskFromElement(element) {
    const item = element.closest("[data-task-id]");
    if (!item) return null;
    return state.tasks.find((task) => task.id === item.dataset.taskId) || null;
  }

  function handleTaskClick(event) {
    const actionButton = event.target.closest("button[data-action]");
    if (!actionButton) return;
    const task = findTaskFromElement(actionButton);
    if (!task) return;

    if (actionButton.dataset.action === "toggle") {
      if (
        !task.done &&
        (!task.title.trim() ||
          !task.criterion.trim() ||
          Number(normalizeMinutes(task.minutes) || 0) <= 0)
      ) {
        showToast("请先填写任务名称、完成标准和有效分钟数。");
        return;
      }
      task.done = !task.done;
      task.example = false;
      saveDay();
      renderTasks();
      showToast(task.done ? "任务已标记为完成。" : "任务已恢复为未完成。");
      return;
    }

    if (actionButton.dataset.action === "delete") {
      state.tasks = state.tasks.filter((item) => item.id !== task.id);
      saveDay();
      renderTasks();
      showToast("任务已删除。");
    }
  }

  function handleTaskInput(event) {
    const field = event.target.dataset.field;
    if (!field) return;
    const task = findTaskFromElement(event.target);
    if (!task) return;

    task[field] = field === "minutes" ? normalizeMinutes(event.target.value) : event.target.value;
    task.example = false;
    saveDay();

    if (field === "minutes") {
      renderSummary();
    }
  }

  function isDayComplete(dayState) {
    return (
      Boolean(dayState) &&
      Array.isArray(dayState.tasks) &&
      dayState.tasks.length > 0 &&
      dayState.tasks.every((task) => task.done)
    );
  }

  function getDayStateForDate(date) {
    const key = toDateKey(date);
    return key === todayKey ? state : loadDayByKey(key);
  }

  function renderWeek() {
    const dayLabels = ["一", "二", "三", "四", "五", "六", "日"];
    const currentDayIndex = (today.getDay() + 6) % 7;
    const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - currentDayIndex);
    elements.weekGrid.replaceChildren();

    dayLabels.forEach((label, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      const dateKey = toDateKey(date);
      const dayState = getDayStateForDate(date);
      const complete = isDayComplete(dayState);

      const item = document.createElement("div");
      item.className = [
        "week-day",
        dateKey === todayKey ? "today" : "",
        complete ? "complete" : ""
      ]
        .filter(Boolean)
        .join(" ");
      item.setAttribute(
        "aria-label",
        `${dateKey}，${complete ? "全部任务已完成" : "没有完整完成记录"}`
      );

      const weekday = document.createElement("span");
      weekday.textContent = label;
      const dateNumber = document.createElement("strong");
      dateNumber.textContent = String(date.getDate());
      const dot = document.createElement("i");
      dot.setAttribute("aria-hidden", "true");
      item.append(weekday, dateNumber, dot);
      elements.weekGrid.append(item);
    });

    elements.streakCount.textContent = String(calculateLocalStreak());
  }

  function calculateLocalStreak() {
    const cursor = new Date(today);
    if (!isDayComplete(state)) {
      cursor.setDate(cursor.getDate() - 1);
    }

    let streak = 0;
    for (let index = 0; index < 366; index += 1) {
      const dayState = getDayStateForDate(cursor);
      if (!isDayComplete(dayState)) break;
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  function calculateReportStats() {
    const completedTasks = state.tasks.filter((task) => task.done);
    const completed = completedTasks.length;
    const total = state.tasks.length;
    return {
      completed,
      total,
      rate: total ? Math.round((completed / total) * 100) : 0,
      actualMinutes: completedTasks.reduce(
        (sum, task) => sum + Number(normalizeMinutes(task.minutes) || 0),
        0
      )
    };
  }

  function buildMarkdown() {
    const stats = calculateReportStats();
    const taskLines = state.tasks.length
      ? state.tasks
          .map((task) => {
            const title = task.title.trim() || "未命名任务";
            const criterion = task.criterion.trim() || "未填写完成标准";
            const minutes = Number(normalizeMinutes(task.minutes) || 0);
            return `- [${task.done ? "x" : " "}] ${title}（${minutes} 分钟）\n  - 完成标准：${criterion}`;
          })
          .join("\n")
      : "- 今天没有填写任务";

    return `# 学习日志 ${todayKey}

- 学习者：${profile.learner.trim() || "未填写"}
- 学习方向：${profile.direction.trim() || "未填写"}
- 目标学习时长：${Number(normalizeMinutes(state.targetMinutes) || 0)} 分钟
- 实际完成时长：${stats.actualMinutes} 分钟
- 完成情况：${stats.completed} / ${stats.total}（${stats.rate}%）

## 今日任务

${taskLines}

## 今天学会了什么

${state.learned.trim() || "未填写"}

## 遇到的问题

${state.problems.trim() || "未填写"}

## 明日计划

${state.tomorrow.trim() || "未填写"}

## 学习成果

提交日报时，请同时附上当天产生的：

- 代码文件
- 练习题
- 学习笔记
- 项目链接
- 必要的少量截图
`;
  }

  function exportMarkdown() {
    saveDay();
    const blob = new Blob([buildMarkdown()], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${todayKey}.md`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    showToast(`已导出 ${todayKey}.md`);
  }

  async function copyMarkdown() {
    const markdown = buildMarkdown();
    try {
      await navigator.clipboard.writeText(markdown);
      showToast("Markdown 内容已复制。");
    } catch {
      const helper = document.createElement("textarea");
      helper.value = markdown;
      helper.setAttribute("readonly", "");
      helper.style.position = "fixed";
      helper.style.opacity = "0";
      document.body.append(helper);
      helper.select();
      const copied = document.execCommand("copy");
      helper.remove();
      showToast(copied ? "Markdown 内容已复制。" : "复制失败，请使用导出按钮。");
    }
  }

  function clearToday() {
    const confirmed = window.confirm(
      "确定清空今天的任务、目标时间和复盘内容吗？学习者姓名与方向会保留。"
    );
    if (!confirmed) return;

    state = createEmptyDayState();
    try {
      localStorage.setItem(dayStorageKey, JSON.stringify(state));
    } catch (error) {
      handleStorageError(error);
    }
    hydrateFields();
    renderTasks();
    renderWeek();
    markSaved();
    showToast("今日数据已清空。");
  }

  function bindFieldEvents() {
    elements.learnerInput.addEventListener("input", () => {
      profile.learner = elements.learnerInput.value;
      saveProfile();
      updateSuggestedPath();
    });

    elements.directionInput.addEventListener("input", () => {
      profile.direction = elements.directionInput.value;
      saveProfile();
    });

    elements.targetMinutesInput.addEventListener("input", () => {
      state.targetMinutes = normalizeMinutes(elements.targetMinutesInput.value);
      saveDay();
    });

    [
      ["learned", elements.learnedInput],
      ["problems", elements.problemsInput],
      ["tomorrow", elements.tomorrowInput]
    ].forEach(([field, input]) => {
      input.addEventListener("input", () => {
        state[field] = input.value;
        saveDay();
      });
    });
  }

  function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add("visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => elements.toast.classList.remove("visible"), 2200);
  }

  function bindEvents() {
    bindFieldEvents();
    elements.addTaskButton.addEventListener("click", addTask);
    elements.taskList.addEventListener("click", handleTaskClick);
    elements.taskList.addEventListener("input", handleTaskInput);
    elements.exportButton.addEventListener("click", exportMarkdown);
    elements.copyButton.addEventListener("click", copyMarkdown);
    elements.clearButton.addEventListener("click", clearToday);
  }

  function init() {
    renderDate();
    hydrateFields();
    renderTasks();
    renderWeek();
    bindEvents();
  }

  init();
})();
