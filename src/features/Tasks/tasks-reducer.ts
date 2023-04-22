import {appActions} from "app/app-reducer";
import {createSlice} from "@reduxjs/toolkit";
import {todosThunks} from "features/TodolistsList/todolists-reducer";
import {clearTasksAndTodos} from "features/TodolistsList/Todolist/additionalActions";
import {createAppAsyncThunk, handleServerAppError, handleServerNetworkError} from "common/utils";
import {
    AddTaskArgType, RemoveTaskArgType,
    TaskType,
    todolistsAPI,
    UpdateTaskArgType,
    UpdateTaskModelType
} from "features/TodolistsList/Todolist/todolists.api";
import {ResultCode, TaskPriorities, TaskStatuses} from "common/enums/emuns";
import {thunkTryCatch} from "common/utils/thunk-try-catch";


const initialState: TasksStateType = {}


const fetchTasks = createAppAsyncThunk<{ tasks: TaskType[], todolistId: string }, string>('tasks/fetchTasks',
    async (todolistId, thunkAPI) => {
        const {dispatch, rejectWithValue} = thunkAPI
        try {
            dispatch(appActions.setAppStatus({status: 'loading'}))
            const res = await todolistsAPI.getTasks(todolistId)
            const tasks = res.data.items
            dispatch(appActions.setAppStatus({status: 'succeeded'}))
            return {tasks, todolistId}
        } catch (e) {
            handleServerNetworkError(e, dispatch)
            return rejectWithValue(null)
        }
    })

const addTask = createAppAsyncThunk<{ task: TaskType }, AddTaskArgType>
('tasks/addTask', async (arg, thunkAPI) => {
    const {dispatch, rejectWithValue} = thunkAPI
    return thunkTryCatch(thunkAPI, async () => {
        dispatch(appActions.setAppStatus({status: 'loading'}))
        const res = await todolistsAPI.createTask(arg)
        if (res.data.resultCode === ResultCode.Success) {
            const task = res.data.data.item
            dispatch(appActions.setAppStatus({status: 'succeeded'}))
            return {task}
        } else {
            handleServerAppError(res.data, dispatch)
            return rejectWithValue(null)
        }
    })
})

const removeTask = createAppAsyncThunk<RemoveTaskArgType, RemoveTaskArgType>
('tasks/removeTask', async (arg, thunkAPI) => {
    const {dispatch, rejectWithValue} = thunkAPI
    try {
        dispatch(appActions.setAppStatus({status: 'loading'}))
        const res = await todolistsAPI.deleteTask(arg)
        if (res.data.resultCode === ResultCode.Success) {
            dispatch(appActions.setAppStatus({status: 'succeeded'}))
            return arg
        } else {
            handleServerAppError(res.data, dispatch)
            return rejectWithValue(null)
        }
    } catch (e) {
        handleServerNetworkError(e, dispatch)
        return rejectWithValue(null)
    }
})

const updateTask = createAppAsyncThunk<UpdateTaskArgType, UpdateTaskArgType>
('tasks/updateTask', async (arg, thunkAPI) => {
    const {dispatch, rejectWithValue, getState} = thunkAPI
    try {
        dispatch(appActions.setAppStatus({status: 'loading'}))
        const task = getState().tasks[arg.todolistId].find(t => t.id === arg.taskId)
        if (!task) {
            console.warn('task not found in the state')
            return rejectWithValue(null)
        }

        const apiModel: UpdateTaskModelType = {
            deadline: task.deadline,
            description: task.description,
            priority: task.priority,
            startDate: task.startDate,
            title: task.title,
            status: task.status,
            ...arg.domainModel
        }
        const res = await todolistsAPI.updateTask(arg.todolistId, arg.taskId, apiModel)
        if (res.data.resultCode === ResultCode.Success) {
            dispatch(appActions.setAppStatus({status: 'succeeded'}))
            return arg
        } else {
            handleServerAppError(res.data, dispatch)
            return rejectWithValue(null)
        }
    } catch (e) {
        handleServerNetworkError(e, dispatch)
        return rejectWithValue(null)
    }
})


const slice = createSlice({
    name: 'tasks',
    initialState,
    reducers: {
    },
    extraReducers: builder => {
        builder
            .addCase(fetchTasks.fulfilled, (state, action) => {
                state[action.payload.todolistId] = action.payload.tasks
            })
            .addCase(addTask.fulfilled, (state, action) => {
                state[action.payload.task.todoListId].unshift(action.payload.task)
            })
            .addCase(removeTask.fulfilled, (state, action) => {
                const tasks = state[action.payload.todolistId]
                const index = tasks.findIndex(t => t.id === action.payload.taskId)
                if (index !== -1)
                    tasks.splice(index, 1)
            })
            .addCase(updateTask.fulfilled, (state, action) => {
                const tasks = state[action.payload.todolistId]
                const index = tasks.findIndex(t => t.id === action.payload.taskId)
                if (index !== -1)
                    tasks[index] = {...tasks[index], ...action.payload.domainModel}
            })
            .addCase(todosThunks.addTodolist.fulfilled, (state, action) => {
                state[action.payload.todolist.id] = []
            })
            .addCase(todosThunks.removeTodolist.fulfilled, (state, action) => {
                delete state[action.payload.todolistId]
            })
            .addCase(todosThunks.fetchTodolists.fulfilled, (state, action) => {
                action.payload.todos.forEach((tl) => {
                    state[tl.id] = []
                })
            })
            .addCase(clearTasksAndTodos, () => {
                return {}
            })
    }
})

export const tasksReducer = slice.reducer
export const tasksThunks = {fetchTasks, addTask, updateTask, removeTask}

// types
export type UpdateDomainTaskModelType = {
    title?: string
    description?: string
    status?: TaskStatuses
    priority?: TaskPriorities
    startDate?: string
    deadline?: string
}
export type TasksStateType = {
    [key: string]: Array<TaskType>
}
