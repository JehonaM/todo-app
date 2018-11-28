import { InMemoryDbService } from 'angular-in-memory-web-api';
import { Task } from './task';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class InMemoryDataService implements InMemoryDbService {
  createDb() {
    const tasks = [
        { id: 1,
            name: 'Mr. Nice',
            descrption: 'did the job',
            type: 'generic',
            isdone: true
        },
        { id: 2,
            name: 'Mr. Nice',
            descrption: 'did the job',
            type: 'generic',
            isdone: true
        }
        ,
        { id: 3,
            name: 'Mr. Nice',
            descrption: 'did the job',
            type: 'generic',
            isdone: true
        },
        { id: 4,
            name: 'Mr. Nice',
            descrption: 'did the job',
            type: 'generic',
            isdone: true
        }
    ];
    return {tasks};
  }

  genId(tasks: Task[]): number {
    return tasks.length > 0 ? Math.max(...tasks.map(task => task.id)) + 1 : 11;
  }
}
