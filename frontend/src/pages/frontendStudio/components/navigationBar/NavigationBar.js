import { useState } from "react";

import ProjectBar from "./ProjectBar";
import StatusUpdateBar from "./StatusUpdateBar";
import { selectUserTask } from "../../../../redux/slices/userTasksSlice";
import { useDispatch } from "react-redux";

export default function NavigationBar() {
  const [isProjectBarOpen, setIsProjectBarOpen] = useState(false);
  const [isStatusUpdateBarOpen, setIsStatusUpdateBarOpen] = useState(false);
  const dispatch = useDispatch();

  const handleProjectBarOpenClose = (open) => {
    setIsProjectBarOpen(open);
    if (open) setIsStatusUpdateBarOpen(false);
  }

  const handleStatusUpdateBarOpenClose = (open) => {
    setIsStatusUpdateBarOpen(open);
    if (open) setIsProjectBarOpen(false);
  }

  return (
    <aside className="flex w-full h-full flex-col mt-1 gap-6">"
      <div 
        className={'flex w-full min-height-[100px]'}
        style={{ maxHeight: 'calc(100% - 200px)'}}
      >
        <ProjectBar 
          setOpen = {handleProjectBarOpenClose}
          isOpen = {isProjectBarOpen}
          onSelectTask={(task) => {
            dispatch(selectUserTask(task));
          }}
        />
      </div>
      <div 
        className={'flex w-full min-height-[100px]'}
        style={{ maxHeight: 'calc(100% - 200px)'}}
      >
        <StatusUpdateBar
          setOpen={handleStatusUpdateBarOpenClose}
          isOpen = {isStatusUpdateBarOpen}
        />
      </div>
    </aside>
  )
}
