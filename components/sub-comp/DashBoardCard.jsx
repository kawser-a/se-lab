'use client';
import { Plus, RotateCw, X } from 'lucide-react';
import { BorderBeam } from '../magicui/border-beam';
import GradientChart from './GradientChart';
import UpperPortionOfDash from './UpperPortionOfDash';

const DashBoardCard = () => {
    return (
        <div className="relative w-[780px] h-[500px] flex items-center rounded-[24px] justify-center">
            <div className="relative w-full h-full">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-full h-full border-gray-700 rounded-[24px] overflow-hidden border-[14px] shadow-2xl">

                        <div className="absolute top-[-7px] left-1/2 -translate-x-1/2 w-[70px] h-[18px] bg-black rounded-b-xl z-30 flex items-center justify-center">
                            <div className="w-[6px] h-[6px] bg-gray-400 rounded-full opacity-70"></div>
                        </div>

                        <div className="h-full flex flex-col">
                            <div className="h-8 bg-gray-800/90 backdrop-blur-md flex items-center px-4 border-b border-gray-700/50">
                                <div className="flex space-x-2 mr-4">
                                    <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]"></div>
                                    <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]"></div>
                                    <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]"></div>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-300 font-medium px-2 py-1 rounded bg-gray-700/30">
                                    GrowthGrid
                                    <X className="w-4 h-4 text-gray-400 cursor-pointer" />
                                </div>
                                <div className="mx-2">
                                    <Plus className="w-4 h-4 text-gray-300 cursor-pointer" />
                                </div>
                                <div className="ml-auto flex items-center space-x-4">
                                    <div className="text-xs text-gray-400">9:41 AM</div>
                                    <RotateCw className="w-4 h-4 text-gray-400 cursor-pointer" />
                                </div>
                            </div>

                            {/* Panels */}
                            <div className="flex flex-col w-full gap-0.5 overflow-hidden bg-[#121212] p-2 rounded-b-lg">
                                <div className=''>
                                    <UpperPortionOfDash/>
                                </div>
                                <div><GradientChart/></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <BorderBeam
                size={100}
                colorFrom="#9EFF00"
                colorTo="#004400"
                duration={12}
                borderWidth={3.5}
            />
        </div>
    );

};

export default DashBoardCard;
