import {Dispatch} from 'redux'
import {appActions} from "app/app-reducer";
import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {todolistsActions} from "features/TodolistsList/todolists-reducer";
import {clearTasksAndTodos} from "features/TodolistsList/Todolist/additionalActions";
import {createAppAsyncThunk, handleServerAppError, handleServerNetworkError} from "common/utils";
import {
    AddTaskArgType,
    TaskType,
    todolistsAPI,
    UpdateTaskArgType,
    UpdateTaskModelType
} from "features/TodolistsList/Todolist/todolists.api";
import {ResultCode, TaskPriorities, TaskStatuses} from "common/enums/emuns";


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
    try {
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
        removeTask: (state, action: PayloadAction<{ taskId: string, todolistId: string }>) => {
            const tasks = state[action.payload.todolistId]
            const index = tasks.findIndex(t => t.id === action.payload.taskId)
            if (index !== -1)
                tasks.splice(index, 1)
        }
    },
    extraReducers: builder => {
        builder
            .addCase(fetchTasks.fulfilled, (state, action) => {
                state[action.payload.todolistId] = action.payload.tasks
            })
            .addCase(addTask.fulfilled, (state, action) => {
                state[action.payload.task.todoListId].unshift(action.payload.task)
            })
            .addCase(updateTask.fulfilled, (state, action) => {
                const tasks = state[action.payload.todolistId]
                const index = tasks.findIndex(t => t.id === action.payload.taskId)
                if (index !== -1)
                    tasks[index] = {...tasks[index], ...action.payload.domainModel}
            })
            .addCase(todolistsActions.addTodolist, (state, action) => {
                state[action.payload.todolist.id] = []
            })
            .addCase(todolistsActions.removeTodolist, (state, action) => {
                delete state[action.payload.id]
            })
            .addCase(todolistsActions.setTodos, (state, action) => {
                action.payload.todos.forEach(todo => state[todo.id] = [])
            })
            .addCase(clearTasksAndTodos, () => {
                return {}
            })
    }
})

export const tasksReducer = slice.reducer
export const tasksActions = slice.actions
export const tasksThunks = {fetchTasks, addTask, updateTask}


// thunks

export const removeTaskTC = (taskId: string, todolistId: string) => (dispatch: Dispatch) => {
    todolistsAPI.deleteTask(todolistId, taskId)
        .then(() => {
            const action = tasksActions.removeTask({taskId, todolistId})
            dispatch(action)
        })
}

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


// export const _tasksReducer = (state: TasksStateType = initialState, action: ActionsType): TasksStateType => {
//     switch (action.type) {
//         case 'REMOVE-TASK':
//             return {...state, [action.todolistId]: state[action.todolistId].filter(t => t.id != action.taskId)}
//         case 'ADD-TASK':
//             return {...state, [action.task.todoListId]: [action.task, ...state[action.task.todoListId]]}
//         case 'UPDATE-TASK':
//             return {
//                 ...state,
//                 [action.todolistId]: state[action.todolistId]
//                     .map(t => t.id === action.taskId ? {...t, ...action.model} : t)
//             }
//         case 'ADD-TODOLIST':
//             return {...state, [action.todolist.id]: []}
//         case 'REMOVE-TODOLIST':
//             const copyState = {...state}
//             delete copyState[action.id]
//             return copyState
//         case 'SET-TODOLISTS': {
//             const copyState = {...state}
//             action.todolists.forEach(tl => {
//                 copyState[tl.id] = []
//             })
//             return copyState
//         }
//         case 'SET-TASKS':
//             return {...state, [action.todolistId]: action.tasks}
//         default:
//             return state
//     }
// }

//export const removeTaskAC = (taskId: string, todolistId: string) => ({type: 'REMOVE-TASK', taskId, todolistId} as const)
// export const addTaskAC = (task: TaskType) => ({type: 'ADD-TASK', task} as const)
// export const updateTaskAC = (taskId: string, model: UpdateDomainTaskModelType, todolistId: string) =>
//     ({type: 'UPDATE-TASK', model, todolistId, taskId} as const)
// export const setTasksAC = (tasks: Array<TaskType>, todolistId: string) =>
//     ({type: 'SET-TASKS', tasks, todolistId} as const)