import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Task } from '../task';
import { TaskService } from '../task.service';

@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.css']
})
export class TasksComponent implements OnInit {
  tasks: Task[];

  constructor(
      private taskService: TaskService,
      private router: ActivatedRoute,
      ) { }

  ngOnInit() {
    this.getTasks();
  }

  getTasks(): void {
    this.taskService.getTasks()
    .subscribe(tasks => this.tasks = tasks);
  }

  add(name: string,descrption,type,isdone): void {
    name = name.trim();
    isdone=false;
    if (!name) { return; }
    this.taskService.addTask({ name,descrption,type,isdone } as Task)
      .subscribe(task => {
        this.tasks.push(task);
               });

  }

  delete(task: Task): void {
    this.tasks = this.tasks.filter(h => h !== task);
    this.taskService.deleteTask(task).subscribe();
  }


}
