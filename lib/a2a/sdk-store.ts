import { Task, type ListTasksRequest, type ListTasksResponse } from "@a2a-js/sdk"
import type { TaskStore } from "@a2a-js/sdk/server"
import { getTask, listTasks, saveTask, type Task as WireTask } from "@/lib/a2a/tasks"

// THE SDK'S TASK STORE OVER THE ELEMENT'S OWN TASK FILES (step 418-1). The official A2A SDK keeps tasks in its protobuf form;
// this element keeps them as wire JSON in `SERVICE_DATA_DIR/a2a/tasks` (`lib/a2a/tasks.ts`), where the agent's answer door
// (`/api/a2a/tasks/[id]`) and background work also write. `Task.fromJSON` / `Task.toJSON` translate both ways without loss
// (measured on a task with text and data parts and metadata), so every writer keeps working as it did.

export class ElementTaskStore implements TaskStore {
  async save(task: Task): Promise<void> {
    saveTask(Task.toJSON(task) as WireTask)
  }

  async load(taskId: string): Promise<Task | undefined> {
    const t = getTask(taskId)
    return t ? Task.fromJSON(t) : undefined
  }

  async list(params: ListTasksRequest): Promise<ListTasksResponse> {
    const all = listTasks(params.contextId || undefined)
    const size = params.pageSize && params.pageSize > 0 ? params.pageSize : all.length
    const tasks = all.slice(0, size).map((t) => Task.fromJSON(t))
    return { tasks, nextPageToken: "", pageSize: tasks.length, totalSize: all.length } as unknown as ListTasksResponse
  }
}
