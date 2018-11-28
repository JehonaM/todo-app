import { Component, OnInit } from '@angular/core';
import { Task } from '../task';
import { TaskService } from '../task.service';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: [ './dashboard.component.css' ]
})
export class DashboardComponent implements OnInit {
  tasks: Task[] = [];
    startupsLinks:Task[] = [];

  constructor(private taskService: TaskService) { }

  ngOnInit() {
    this.getTasks();

  }

  getTasks(): void {
    this.taskService.getTasks()
      .subscribe(tasks => this.tasks = tasks.slice(0, 7));
  }


    update(task): void {
        task.isdone = !task.isdone;
        this.taskService.updateTask(task)
            .subscribe(task => {
                this.taskService.updateTask(task);
            });
    }

}
